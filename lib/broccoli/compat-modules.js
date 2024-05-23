const eagerModules = {};
await Promise.all(Object.keys(PRIVATE_SYSTEM_HERE.registerRegistry).map(async (name) => {
  try {
    let result = await import(name);
    eagerModules[name] = result;
  } catch (err) {
    console.log(`failing for ${name}`, err);
  }
}))

export default eagerModules;