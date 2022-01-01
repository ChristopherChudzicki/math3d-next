import { User } from "../../database/models";

export default async (email: string) => {
  const user = await User.findOne({
    where: {
      email,
    },
  });
  console.log(user);
  return true;
};
