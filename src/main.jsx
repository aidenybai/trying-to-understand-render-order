import React from 'react';
import ReactDOMClient from 'react-dom/client';

let owner = null;
let danglingTriggers = [];

const markTrigger = (name) => {
  if (owner) owner.trigger = owner.name;
  if (name) {
    danglingTriggers.push(name);
  }
};

/**
 * This is a workaround if the owner doesn't exist but we know it has been triggered (marked in markTrigger).
 * This is supported in main anya but not here
 */
const revalidateDanglingTriggers = () => {
  for (let i = danglingTriggers.length - 1; i >= 0; i--) {
    let trigger = danglingTriggers[i];
    if (owner.name === trigger) {
      owner.trigger = trigger;
      danglingTriggers.splice(i, 1);
    }
  }
};

const log = (name) => {
  console.log(name, { trigger: owner?.trigger });
};

const trackComponent = (name, fn) => {
  return (...args) => {
    let parentOwner = owner;
    owner = {
      name,
      parentOwner,
      trigger: parentOwner?.trigger,
    };
    revalidateDanglingTriggers();
    try {
      return fn(...args);
    } finally {
      log(name);
      if (parentOwner && owner?.trigger && name.startsWith('use')) {
        parentOwner.trigger = owner.trigger;
      }
      owner = parentOwner;
    }
  };
};

export const useState1 = trackComponent('useState1', (initialState) => {
  const [state, setState] = React.useState(initialState);
  return [
    state,
    (newValue) => {
      setState(newValue);
      markTrigger('useState1');
    },
  ];
});

export const useState2 = trackComponent('useState2', (initialState) => {
  const [state, setState] = React.useState(initialState);
  return [
    state,
    (newValue) => {
      setState(newValue);
      markTrigger('useState2');
    },
  ];
});

export const App = trackComponent('App', () => {
  const [count, setCount] = useState1(0);
  const [count2, setCount2] = useState2(0);

  // React.useMemo(() => {
  //   // for funsies
  //   markTrigger();
  // }, [count, count2]);

  useApp();
  return (
    <>
      <A1 />
      <B1
        onClick={() => {
          setCount(count + 1);
          setCount2(count2 + 1);
        }}
        count={count}
      />
      <C1 onClick={() => setCount2(count2 + 1)} count={count2} />
    </>
  );
});

export const useApp = trackComponent('useApp', () => {});

export const A1 = trackComponent('A1', () => {
  return <A2 />;
});

export const useA2 = trackComponent('useA2', () => {
  markTrigger();
});

export const A2 = trackComponent('A2', () => {
  useA2();
  return <></>;
});

export const B1 = trackComponent('B1', ({ onClick, count }) => {
  return <button onClick={onClick}>{count}</button>;
});

export const C1 = trackComponent('C1', ({ onClick, count }) => {
  useC1();
  return <button onClick={onClick}>{count}</button>;
});

export const useC1 = trackComponent('useC1', () => {});

const root = ReactDOMClient.createRoot(document.getElementById('root'));
root.render(<App />);
