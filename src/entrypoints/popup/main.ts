import { mount } from "svelte";
import "@/components/base.css";
import App from "./App.svelte";

const target = document.getElementById("app");
if (target === null) throw new Error("#app is missing from popup/index.html");

export default mount(App, { target });
