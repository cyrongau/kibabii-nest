async function test() {
  try {
    const res = await fetch('http://localhost:3000/properties?landlordId=e120cb19-2a0d-4bdd-9872-766c7ab5bd92');
    const data = await res.json();
    console.log('Result count:', data.length);
    if (data.length > 0) {
      console.log('First property:', data[0].name);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
