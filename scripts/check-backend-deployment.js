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
  ];

  for (const path of paths) {
    const value = getNestedValue(info, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
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

  const infoResponse = await request(`${baseUrl}/actuator/info`, { redirect: 'manual' });
  if (!infoResponse.ok) {
    const location = infoResponse.headers?.get?.('location');
    throw new Error(
      `Backend deployment metadata is unavailable: HTTP ${infoResponse.status}${location ? `, location ${location}` : ''}`,
    );
  }

  const info = await readJsonResponse(infoResponse);
  const deploymentVersion = findDeploymentVersion(info);
  if (!deploymentVersion) {
    throw new Error('Backend deployment metadata must include a commit SHA or image tag.');
  }

  return { deploymentVersion, readiness: readiness.status };
}

async function main() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is required.');
  }

  const result = await checkBackendDeployment(apiUrl);
  console.log(`Backend readiness: ${result.readiness}`);
  console.log(`Backend deployment version: ${result.deploymentVersion}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = { checkBackendDeployment, findDeploymentVersion };
