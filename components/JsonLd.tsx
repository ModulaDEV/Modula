import { siteConfig } from "@/site.config";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        sameAs: [siteConfig.twitter, siteConfig.githubUrl],
        description: siteConfig.shortDescription,
        foundingDate: `${siteConfig.launchYear}-01-01`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}#organization` },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}#protocol`,
        name: `${siteConfig.name} Protocol`,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Base (L2)",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "0% protocol fee. Pay-per-inference settles in USDC.",
        },
        description: siteConfig.description,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
