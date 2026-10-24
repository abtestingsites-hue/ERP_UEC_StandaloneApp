const x = 1;
const fn = (source) => {
  const { x } = source || { x };
  console.log(x);
}
fn({ x: 5 });
fn();
