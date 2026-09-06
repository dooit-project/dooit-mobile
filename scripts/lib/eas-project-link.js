function usefulLines(value) {
  return (
    value
      ?.split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !line.startsWith('★') &&
          line !== 'To upgrade, run:' &&
          !line.startsWith('npm install -g eas-cli') &&
          line !== 'Proceeding with outdated version.',
      ) ?? []
  );
}

function evaluateEasProjectLink(result, expectedSlug) {
  if (result.status === 0) {
    return {
      passed: true,
      details: `linked project matches ${expectedSlug}`,
    };
  }

  if (result.error?.code === 'ETIMEDOUT') {
    return {
      passed: false,
      details: 'EAS project check timed out; check network access and retry.',
    };
  }

  const lines = [...usefulLines(result.stderr), ...usefulLines(result.stdout)];
  const failure =
    lines.find((line) => line.startsWith('Project config:')) ??
    lines.find((line) => /slug|project/i.test(line)) ??
    lines[0];
  return {
    passed: false,
    details:
      failure ??
      `Run \`eas project:info --json\` and confirm the linked project slug is ${expectedSlug}.`,
  };
}

module.exports = { evaluateEasProjectLink };
