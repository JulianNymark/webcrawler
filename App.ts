import {extractInfo} from './crawler'

async function main() {
  console.log("cli args: ", process.argv);
  const hasInputParam = process.argv.length >= 3;
  const someUrl = hasInputParam ? process.argv[process.argv.length - 1] : "https://juliannymark.com";

  const test = await extractInfo(someUrl);

  console.log("keywords found: ", test.keywords);
  console.log("links found: ", test.links);
}

main();

// some way to call extractlinks (maybe lambdas?)
// insert results into db (duplicates from single page ignored, link to existing++...etc)
