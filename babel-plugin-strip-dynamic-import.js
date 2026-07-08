/**
 * Neutralizes dynamic `import(expr)` calls whose argument is NOT a static
 * string literal. Hermes cannot parse/execute arbitrary dynamic imports, so
 * these would crash the release bundle anyway (e.g. @supabase/supabase-js's
 * optional OpenTelemetry loader `import(OTEL_PKG)`). Static `import('./mod')`
 * calls are left intact so Metro can still handle real lazy imports.
 */
module.exports = function () {
  return {
    name: 'strip-variable-dynamic-import',
    visitor: {
      Import(path) {
        const call = path.parentPath;
        if (!call.isCallExpression()) return;
        const arg = call.node.arguments[0];
        if (arg && arg.type === 'StringLiteral') return; // keep static imports
        call.replaceWithSourceString(
          "Promise.reject(new Error('Dynamic import is not supported'))"
        );
      },
    },
  };
};
