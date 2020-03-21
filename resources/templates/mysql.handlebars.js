// https://2ality.com/2018/04/async-iter-nodejs.html

function* hello() {
  yield Promise.resolve('hello: 1');
  yield Promise.resolve('world: 2');
}

async function world() {
  const rows = hello();
  for await (const row of rows) {
    console.log(row);
  }
}

world();
