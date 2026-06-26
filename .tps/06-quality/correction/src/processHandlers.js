// Installation des handlers de process. Extrait dans un module pour etre
// testable (on verifie que les listeners sont bien enregistres).
export function installProcessHandlers(proc = process, exit = (c) => proc.exit(c)) {
  proc.on("uncaughtException", (err) => {
    console.error("uncaughtException", err);
    exit(1);
  });
  proc.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection", reason);
    exit(1);
  });
}
