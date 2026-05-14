/**
 * Generates a random alphanumeric string of a specified length.
 * @param length The length of the random string to generate. Defaults to 4.
 * @returns A random alphanumeric string.
 */
const getRandomString = (length = 4): string => {
  let str = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    str += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return str;
};

export { getRandomString };
