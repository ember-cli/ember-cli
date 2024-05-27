EmberENV.TESTS_FILE_LOADED = true;
(async () => {
  let { default: loadTests } = await PRIVATE_SYSTEM_HERE.import('@ember/compat-modules')
  await loadTests('{{MODULE_PREFIX}}/tests');
  await PRIVATE_SYSTEM_HERE.import('{{MODULE_PREFIX}}/tests/test-helper');
})();
