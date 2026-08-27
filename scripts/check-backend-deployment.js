function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function getNestedValue(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value);
}

function findDeploymentVersion(info) {
  const paths = [
    'git.commit.id.full',
    'git.commit.id.abbrev',
    'git.commit.id',
    'image.tag',
    'commitSha',
    'commit',
    'imageTag',
    'version',
  ];

  for (const path of paths) {
    const value = getNestedValue(info, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function readMetadataData(body) {
  return body?.status === 'success' && body.data ? body.data : body;
}

function normalizeMetadata(body) {
  const data = readMetadataData(body);
  const commitSha = typeof data?.commitSha === 'string' ? data.commitSha.trim() : '';
  const imageTag = typeof data?.imageTag === 'string' ? data.imageTag.trim() : '';
  const version = typeof data?.version === 'string' ? data.version.trim() : '';

  return {
    commitSha: commitSha || undefined,
    imageTag: imageTag || undefined,
    version: version || undefined,
  };
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function checkBackendDeployment(apiUrl, request = fetch) {
  const baseUrl = trimTrailingSlash(apiUrl);
  const readinessResponse = await request(`${baseUrl}/actuator/health/readiness`, {
    redirect: 'manual',
  });
  const readiness = await readJsonResponse(readinessResponse);

  if (!readinessResponse.ok || readiness?.status !== 'UP') {
    throw new Error(
      `Backend readiness check failed: HTTP ${readinessResponse.status}, status ${readiness?.status ?? 'unknown'}`,
    );
  }

  const metadataResponse = await request(`${baseUrl}/api/v1/system/metadata`, {
    redirect: 'manual',
  });
  if (!metadataResponse.ok) {
    const location = metadataResponse.headers?.get?.('location');
    throw new Error(
      `Backend deployment metadata is unavailable: HTTP ${metadataResponse.status}${location ? `, location ${location}` : ''}`,
    );
  }

  const metadataBody = await readJsonResponse(metadataResponse);
  const metadata = normalizeMetadata(metadataBody);
  const deploymentVersion = findDeploymentVersion(metadata);
  if (!deploymentVersion) {
    throw new Error('Backend deployment metadata must include commitSha, imageTag, or version.');
  }

  return { deploymentVersion, metadata, readiness: readiness.status };
}

async function main() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is required.');
  }

  const result = await checkBackendDeployment(apiUrl);
  console.log(`Backend readiness: ${result.readiness}`);
  console.log(`Backend deployment version: ${result.deploymentVersion}`);
  console.log(`Backend commit SHA: ${result.metadata.commitSha ?? 'not provided'}`);
  console.log(`Backend image tag: ${result.metadata.imageTag ?? 'not provided'}`);
  console.log(`Backend app version: ${result.metadata.version ?? 'not provided'}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = { checkBackendDeployment, findDeploymentVersion, normalizeMetadata };
