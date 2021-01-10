const communication = (url, method, body) => new Promise(
  (resolve, reject) => {
    const payload = {};
    const init = { method, credentials: 'include' };
    if (body) {
      init.body = JSON.stringify(body);
    }
    fetch(url, init).then((result) => {
      payload.status = result.status;
      return result.json();
    }).then((result) => {
      if (result.succeed) {
        if (method === 'GET' || result.payload) {
          resolve(result.payload);
        } else {
          resolve();
        }
      } else {
        payload.message = result.message;
        if (result.inputErrors) {
          payload.inputErrors =  result.inputErrors;
        }
        reject(payload);
      }
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
      payload.message = 'Failed to connect to the server.';
      reject(payload);
    });
  },
);

export const restGet = (url) => new Promise((resolve, reject) => {
  communication(url, 'GET', null).then((result) => resolve(result)).catch((error) => reject(error));
});

export const restDelete = (url) => new Promise((resolve, reject) => {
  communication(url, 'DELETE', null).then((result) => resolve(result)).catch((error) => reject(error));
});

export const restPut = (url, body) => new Promise((resolve, reject) => {
  communication(url, 'PUT', body).then((result) => resolve(result)).catch((error) => reject(error));
});

export const restPost = (url, body) => new Promise((resolve, reject) => {
  communication(url, 'POST', body).then((result) => resolve(result)).catch((error) => reject(error));
});
