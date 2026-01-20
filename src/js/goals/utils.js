export async function runAllAsync(...functions) {
    const promises = functions.map(fn => fn());
    return await Promise.all(promises);
}


export async function runAllAsyncSafe(...functions) {
    const promises = functions.map(fn =>
        fn().then(
            res => ({ status: "fulfilled", value: res }),
            err => ({ status: "rejected", reason: err })
        )
    );

    return await Promise.all(promises);
}