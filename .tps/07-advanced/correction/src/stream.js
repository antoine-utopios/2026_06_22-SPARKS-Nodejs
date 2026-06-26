// Produit un ReadableStream (Web Streams API) emettant le corps JSON encode.
// Teste directement, et reutilise par le serveur (converti via Readable.fromWeb).
export function jsonWebStream(body) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(body)));
      controller.close(); // sans close(), la reponse resterait suspendue.
    },
  });
}

// Lit entierement un ReadableStream Web en chaine UTF-8 (utilitaire de test).
export async function readWebStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}
