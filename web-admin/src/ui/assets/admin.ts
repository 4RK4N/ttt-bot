document.body.addEventListener("htmx:configRequest", (evt) => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const headers = (
    evt as CustomEvent<{ headers?: Record<string, string> }>
  ).detail.headers;
  if (meta && headers) {
    headers["X-CSRF-Token"] = meta.getAttribute("content") || "";
  }
});
