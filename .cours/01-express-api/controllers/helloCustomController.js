import { saveUser } from "../services/userService";

export async function helloCustomController (req, res) {
  const body = req.body;
  // const user = req.user;
  const { firstname, lastname } = body;
  console.log(`Le nom d'utilisateur est '${firstname} ${lastname}'`);
  
  try {
    const userSavedWithId = await saveUser({ firstname, lastname });
  } catch (error) {
    res.status(500).json({
      message: 'Un problème est survenu'
    })
  }

  res.status(200).json({
    message: `Hello ${username}`
  })
}