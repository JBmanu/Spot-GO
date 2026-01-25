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

export function checkEqualsDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export function identityFun(x) {
    return x;
}
