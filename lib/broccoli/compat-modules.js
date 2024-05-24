const eagerModules = {};
globalThis.running = {};
await Promise.all(Object.keys(PRIVATE_SYSTEM_HERE.registerRegistry).map(async (name) => {
  // TODO: pick a different special form that automatically avoids circularity
  if ([import.meta.url, 'ember-test-app/app'].includes(name)) {
    return;
  }
  try {
    running[name] = true;
    let result = await import(name);
    eagerModules[name] = result;
    delete running[name];
  } catch (err) {
    console.log(`failing for ${name}`, err);
    delete running[name];
  }
}))

export default eagerModules;