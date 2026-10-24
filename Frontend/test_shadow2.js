const x = 1;
const getState = () => ({ x });
const fn = (source) => {
  const { x } = source || getState();
  console.log(x);
}
fn({ x: 5 });
fn();
