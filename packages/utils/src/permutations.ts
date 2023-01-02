const permutations = <T>(tokens: T[], subperms: T[][] = [[]]): T[][] =>
  tokens.length === 0
    ? subperms
    : tokens.flatMap((token: T, idx) =>
        permutations(
          tokens.filter((_tok, i) => i !== idx),
          subperms.map((subperm) => subperm.concat([token]))
        )
      );

export default permutations;
