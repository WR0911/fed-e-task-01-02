
const {  log } = console;

// 2.promise改进
setTimeout(function () {
    var a = '1';
    setTimeout(function () {
        var b = '2';
        setTimeout(function () {
            var c = '3';
            log(a + b + c); // 123
        }, 10)
    }, 10)
}, 10)

function fn(data) {
    var p = new Promise(
        function (resolve, reject) {
            resolve(data);
        }
    )
    return p;
}

var promise = Promise.all([
    fn('1'),
    fn('2'),
    fn('3'),
]);
promise.then(function (v) {
    log(v.join('')); // 123
})

// 基于以下代码完成练习
const cars = [{
        name: "Ferrari FF",
        horsepower: 660,
        dollar_value: 700,
        in_stock: true
    },
    {
        name: "Spyker C12 Zagato",
        horsepower: 650,
        dollar_value: 648,
        in_stock: false
    },
    {
        name: "Jaguar XKR-S",
        horsepower: 550,
        dollar_value: 132,
        in_stock: false
    },
    {
        name: "Audi R8",
        horsepower: 525,
        dollar_value: 1142,
        in_stock: false
    },
    {
        name: "Aston Martin One-77",
        horsepower: 750,
        dollar_value: 1850,
        in_stock: true
    },
    {
        name: "Pagani Huayra",
        horsepower: 700,
        dollar_value: 1300,
        in_stock: false
    }
]
// lastStock
// cnpm i --save lodash
let fp = require("lodash/fp");
const lastStock = fp.flowRight(fp.prop("in_stock"), fp.last);
log(lastStock(cars)); // false


// firstName
const firstName = fp.flowRight(fp.prop("name"), fp.head);
log(firstName(cars)); // Ferrari FF


// averageDollarValue
let _average = function (xs) {
    return fp.reduce(fp.add, 0, xs) / xs.length;
};
let averageDollarValue = fp.flowRight(_average, fp.map(car => car.dollar_value));
log(averageDollarValue(cars)); // 962


// sanitizeNames()
let _underscore = fp.replace(/\W+/g, '_');
let sanitizeNames = fp.flowRight(fp.map(_underscore), fp.map(car => car.name));
log(sanitizeNames(cars));


// support.js
class Container {
    static of (value) {
        return new Container(value)
    }
    constructor(value) {
        this._value = value
    }
    map(fn) {
        return Container.of(fn(this._value))
    }
}

class Maybe {
    static of (x) {
        return new Maybe(x)
    }
    isNothing() {
        return this._value === null || this._value === undefined
    }
    constructor(x) {
        this._value = x
    }
    map(fn) {
        return this.isNothing ? this : Maybe.of(fn(this._value))
    }
}

module.exports = {
    Maybe,
    Container
}

// 值增加1
let maybe = Maybe.of([1, 2, 3])
let ex1 = () => {
    return maybe.map(x => fp.map(fp.add(1), x));
}
log(ex1()); // [1,2,3]


// 第一个元素
let xs = Container.of(['do', 'ray', 'me', 'fa', 'so', 'la', 'ti', 'do']);
let ex2 = fp.map(fp.first);
log(xs.map(ex2)); // Container { _value: [ 'd', 'r', 'm', 'f', 's', 'l', 't', 'd' ] }


// user 的名字的首字母
let safeProp = fp.curry(function (x, o) {
    return Maybe.of(o[x])
});
let user = {
    id: 2,
    name: "Albert"
};
let ex3 = () => {
    return safeProp('name', user).map(x => fp.first(x));
}
log(ex3(user)) // { _value: 'Albert' }


// parseInt
let ex4 = fp.flowRight(fp.map(parseInt), Maybe.of);
log(ex4(1)); // 1


// myPromise源码
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class myPromise {
    constructor(executor) {
        try {
            executor(this.resolve, this.reject);

        } catch (e) {
            this.reject(e);
        }
    }
    status = PENDING; // 当前状态
    value = undefined; // 成功的值
    reason = undefined;
    successCallback = []; // 成功回调
    failCallback = [];
    resolve = value => {
        let promise2 = new myPromise(() => {
            // 如果状态不是等待，就不向下执行
            if (this.status !== PENDING) return false;
            this.status = FULFILLED;
            // 保存成功回调的值给then
            this.value = value;
            // 判断成功回调是否存在，存在即调用
            // this.successCallback && this.successCallback(this.value);
            while (this.successCallback.length) { // 异步
                this.successCallback.shift()(); // 依次弹出执行每个成功函数
            }
        })
        return promise2;
    }
    reject = reason => {
        if (this.status !== PENDING) return false;
        this.status = REJECTED;
        this.reason = reason;
        while (this.failCallback.length) { // 异步
            this.failCallback.shift()(); // 依次弹出执行每个成功函数
        }
    }
    then(successCallback, failCallback) {
        successCallback = successCallback ? successCallback : value => value;
        failCallback = failCallback ? failCallback : reason => { throw reason };
        let promise2 = new myPromise((resolve, reject) => {
            if (this.status === FULFILLED) {
                setTimeout(() => {
                    try {
                        let x = successCallback(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0)
            } else if (this.status === REJECTED) {
                setTimeout(() => {
                    try {
                        let x = failCallback(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0)
            } else { // 等待
                this.successCallback.push(() => {
                    setTimeout(() => {
                        try {
                            let x = successCallback(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0)

                });
                this.failCallback.push(() => {
                    setTimeout(() => {
                        try {
                            let x = failCallback(this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0)

                });
            }
        })
        return promise2;
    }
    finally(callback) {
        // 对返回值进行统一处理，可处理异步问题
        // 如果是普通值，转化为promise对象，等待promise对象完成
        // 如果是promise对象，等待promise对象完成
        return this.then( value => {
            return myPromise.realove(callback().then(() => value));
        }, reason => {
             return myPromise.realove(callback().then(() => { throw reason}));
        })
    }
    catch(failback) {
        return this.then(undefined,failback);
    }
    static all(array) { 
        let result = []; 
        let index = 0; // 防止异步，用来和执行的数组参数做比较
        return new MyPromise((resolve, reject) => {   
            function addData(key, value) { 
                result[key] = value;  
                index++; 
                if (index === array.length) {  
                    resolve(result); 
                }
            }
        })
        for (let i = 0; i < array.length; i++) { 
            let current = array[i];
            if (current instanceof MyPromise) {
                // promise对象
                current.then(value => addData(i, value), reason => reject(reason));
            } else {
                addData(i, array[i]);
            }
        }
    }
    static resolve(value) {
        if(value instanceof myPromise) return value;
        return new myPromise(resolve => resolve(value));
    }
}