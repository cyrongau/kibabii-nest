async function test() {
  try {
    const id = 'ceaf7236-6d75-4319-afce-427b8d6cdb9e';
    const res = await fetch(`http://localhost:3000/properties/${id}`);
    const data = await res.json();
    console.log('Property name:', data.name);
    console.log('Verified status:', data.verified);
  } catch (e) {
    console.error(e);
  }
}
test();
