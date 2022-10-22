import paseto from "paseto";

console.time("generateKeyPair");

paseto.V4.generateKey("public", { format: "paserk" }).then((keypair) => {
  console.log(keypair);
  console.timeEnd("generateKeyPair");
});
