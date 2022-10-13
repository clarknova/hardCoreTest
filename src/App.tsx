import { coreSetup } from "./Core";
const core = coreSetup(
  {
    image: "https://images.dog.ceo/breeds/wolfhound-irish/n02090721_2131.jpg",
    counter: 0,
  },
  (values) => values,
  {
    increment(state) {
      return { ...state, counter: state.counter + 1 };
    },
  },
  [
    {
      types: ["increment"],
      async handler(state, action) {
        const res = await fetch("https://dog.ceo/api/breeds/image/random");
        const result = await res.json();
        return { ...state, image: result.message };
      },
    },
  ]
);
function App() {
  return (
    <div>
      <Image />
      <Counter />
      <Control />
    </div>
  );
}

function Image() {
  return <img src={core.useCore((state) => state.image)}></img>;
}

function Counter() {
  return <div>{core.useCore((state) => state.counter)}</div>;
}

function Control() {
  return (
    <button
      onClick={() =>
        core.useCoreDispatch()({ type: "increment", payload: void 0 })
      }
    >
      Next
    </button>
  );
}
export default App;
