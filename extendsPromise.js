export const extendsPromise = (promise) => {
  let isFinished = false;
  let isRejected = false;

  const result = promise
    .then((value) => {
      isFinished = true;
      return value;
    })
    .catch((err) => {
      isRejected = true;
      throw err;
    });

  return {
    promise: result,
    isFinished: () => isFinished,
    isRejected: () => isRejected,
    isPending: () => !isFinished && !isRejected,
  };
};
