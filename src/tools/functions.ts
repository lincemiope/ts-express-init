async function promised<T>(promise: Promise<T>): Promise<[Error, T]> {
    let response: [Error, T];
    return promise.then(data => {
        response = [null, data];
        return response;
    })
    .catch(err => [err, null]);
}

export { promised }