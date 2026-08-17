export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error?.code !== "ERR_MODULE_NOT_FOUND"
      || (!specifier.startsWith("./") && !specifier.startsWith("../"))
      || /\.[cm]?[jt]sx?$/.test(specifier)
    ) {
      throw error;
    }

    for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      try {
        return await nextResolve(`${specifier}${suffix}`, context);
      } catch (candidateError) {
        if (candidateError?.code !== "ERR_MODULE_NOT_FOUND") throw candidateError;
      }
    }

    throw error;
  }
}
