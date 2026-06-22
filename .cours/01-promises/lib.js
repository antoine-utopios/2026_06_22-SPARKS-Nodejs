export function recuperationUtilisateur(id, delaisMs = 100) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        userId: id,
        userName: `User number #${id}`
      })
    }, delaisMs)
  })
}