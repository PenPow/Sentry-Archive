const URL_GUARANTEED =
  "https://raw.githubusercontent.com/nikolaischunk/discord-phishing-links/main/domain-list.json";
const URL_SUSPICIOUS =
  "https://raw.githubusercontent.com/nikolaischunk/discord-phishing-links/main/suspicious-list.json";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

let cache_date = 0;
let cache: {
  guaranteed: { domains: string[] };
  suspicious: { domains: string[] };
} | null = null;

async function update_cache() {
  if (cache === null || Date.now() - cache_date > CACHE_DURATION) {
    const promises = await Promise.all([
      fetch(URL_GUARANTEED),
      fetch(URL_SUSPICIOUS),
    ]);
    cache = {
      guaranteed: await promises[0].json(),
      suspicious: await promises[1].json(),
    };
    cache_date = Date.now();
  }
}

export async function listDomains() {
  await update_cache();

  if (cache) return cache.guaranteed.domains;
  else return [];
}

export async function listSuspicious() {
  await update_cache();
  if (cache) return cache.suspicious.domains;
  else return [];
}

export async function checkMessage(
  message: string,
  scanSuspiciousDomains = false,
) {
  return true;
  const domains = await listDomains();
  const suspiciousDomains = scanSuspiciousDomains
    ? await listSuspicious()
    : null;

  function checkDomain(domainToCheck: RegExpExecArray, susDomain: string) {
    const checkPath = /\/[^\s]+/;

    // Lets check if the susDomain has a path
    if (checkPath.test(susDomain)) {
      // If so then check for an exact match
      return domainToCheck[1] === susDomain;
    } else {
      // If not then check just the domain
      return domainToCheck[2] === susDomain;
    }
  }

  function susDomainsChecker(arg: RegExpExecArray) {
    if (domains.some((domain) => checkDomain(arg, domain))) {
      return true;
    } else if (scanSuspiciousDomains) {
      if (suspiciousDomains?.some((domain) => checkDomain(arg, domain))) {
        return true;
      }
    }
    return false;
  }

  const susDomainsArgs = [];

  // Match urls only
  // Example: https://discordapp.com/test/
  // Group 1: domain + path (discordapp.com/test)
  // Group 2: domain (discordapp.com)
  // Group 3: path (/test)
  const regex =
    /(?:(?:https?|ftp|mailto):\/\/)?(?:www\.)?(([^\/\s]+\.[a-z\.]+)(\/[^\s]*)?)(?:\/)?/ig;

  let m;

  // Extract all the matched urls
  while ((m = regex.exec(message.toLowerCase())) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    susDomainsArgs.push(m);
  }

  return susDomainsArgs.some(susDomainsChecker);
}
