type Target = {
  [key: string]: any
}

type SetterInterceptor = (target: Target, prop: string, value: any, receiver: any) => void

export default function () {

  function createProxy(target: Target, setterInterceptor?: SetterInterceptor) {
    const handler: ProxyHandler<Target> = {
      get(target, prop: string, receiver) {
        if (typeof target[prop] === 'object' && target[prop] !== null) {
          return new Proxy(Reflect.get.apply(null, arguments), handler)
        }
        return Reflect.get.apply(null, arguments);
      },
      set(target, prop, value, receiver) {
        setterInterceptor?.call(null, ...arguments);
        return Reflect.set.apply(null, arguments)
      }
    }
    return new Proxy(target, handler)
  }

  return {
    createProxy
  }
}