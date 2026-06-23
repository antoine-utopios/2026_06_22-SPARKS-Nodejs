import { createApp } from "./api";

const port = process.env.PORT || 3000;

createApp().listen(port, () => {
  console.log(`Application launched on http://localhost:${port}/`);
})