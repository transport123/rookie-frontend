// 在 "generate.js" 中创建一个新的 worker
const worker = new Worker('./generate.js');

// 当用户点击 "Generate primes" 时，给 worker 发送一条消息。
// 消息中的 command 属性是 "generate", 还包含另外一个属性 "quota"，即要生成的质数。
document.querySelector('#generate').addEventListener('click', () => {
  const quota = document.querySelector('#quota').value;
  worker.postMessage({
    command: 'generate',
    quota: quota
  });
});

// 当 worker 给主线程回发一条消息时，为用户更新 output 框，包含生成的质数（从 message 中获取）。
worker.addEventListener('message', message => {
  document.querySelector('#output').textContent = `Finished generating ${message.data} primes!`;
});

document.querySelector('#reload').addEventListener('click', () => {
  document.querySelector('#user-input').value = 'Try typing in here immediately after pressing "Generate primes"';
  document.location.reload();
});


function then(onFulfilled, onRejected) {
  return new Promise((resolve, reject) => {
      const onResolvedFunc = function (val) {
          const cb = function () {
              try {
                  if (typeof onFulfilled !== 'function') { // 如果成功了，它不是个函数，意味着不能处理，则把当前Promise的状态继续向后传递
                      resolve(val);
                      return;
                  }
                  const x = onFulfilled(val);
                  resolve(x);
              } catch (e) {
                  reject(e);
              }
          };
          setTimeout(cb, 0);
      };

      const onRejectedFunc = function (err) {
          const cb = function () {
              try {
                  if (typeof onRejected !== 'function') { // 如果失败了，它不是个函数，意味着不能处理，则把当前Promise的状态继续向后传递
                      reject(err);
                      return;
                  }
                  const x = onRejected(err);
                  resolve(x); //处理了失败，则意味着要返回的新的promise状态是成功的
              } catch (e) {
                  reject(e);
              }
          };
          setTimeout(cb, 0);
      };

      if (this.status === PENDING) {
          this.onFulfilledList.push(onResolvedFunc);
          this.onRejectedList.push(onRejectedFunc);
      } else if (this.status === FULFILLED) {
          //todo
      } else {
          //todo
      }
  });
}