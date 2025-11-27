/**
 * Example usage of the Data Enrichment MCP Server
 * 
 * This file demonstrates how to use the enrichment server to lookup
 * company data from multiple sources (Receita Federal, Google Places, LinkedIn)
 */

// Type declarations for Node.js globals
declare const console: any;

import { createEnrichmentMCPServer } from './enrichment';

async function exampleUsage() {
  // Create enrichment server instance
  const enrichmentServer = createEnrichmentMCPServer({
    timeout: 30000,
    maxRetries: 3,
    secretName: 'fibonacci/mcp/enrichment',
    cacheConfig: {
      enabled: true,
      ttlSeconds: 3600, // 1 hour
      maxEntries: 1000,
    },
    rateLimits: {
      receitaFederal: { requestsPerMinute: 3 },
      googlePlaces: { requestsPerMinute: 50 },
      linkedIn: { requestsPerMinute: 20 },
    },
  });

  // Example 1: Lookup CNPJ data from Receita Federal
  try {
    const cnpjData = await enrichmentServer.lookupCNPJ({
      cnpj: '00.000.000/0001-91', // Formatting is optional
    });

    console.log('CNPJ Data:', {
      razaoSocial: cnpjData.razaoSocial,
      nomeFantasia: cnpjData.nomeFantasia,
      porte: cnpjData.porte,
      atividadePrincipal: cnpjData.atividadePrincipal.descricao,
      endereco: cnpjData.endereco,
    });
  } catch (error) {
    console.error('CNPJ lookup failed:', error);
  }

  // Example 2: Lookup company data from Google Places
  try {
    const placesData = await enrichmentServer.lookupPlaces({
      query: 'Empresa Exemplo São Paulo',
      location: {
        lat: -23.5505,
        lng: -46.6333,
      },
      radius: 5000, // 5km
    });

    console.log('Places Data:', {
      name: placesData.name,
      address: placesData.formattedAddress,
      phone: placesData.phoneNumber,
      website: placesData.website,
      rating: placesData.rating,
    });
  } catch (error) {
    console.error('Places lookup failed:', error);
  }

  // Example 3: Lookup company data from LinkedIn (optional)
  try {
    const linkedInData = await enrichmentServer.lookupLinkedIn({
      companyName: 'Empresa Exemplo',
      domain: 'exemplo.com.br',
    });

    console.log('LinkedIn Data:', {
      name: linkedInData.name,
      description: linkedInData.description,
      industry: linkedInData.industry,
      companySize: linkedInData.companySize,
      followerCount: linkedInData.followerCount,
    });
  } catch (error) {
    console.error('LinkedIn lookup failed:', error);
  }

  // Example 4: Enrich company data from all sources
  try {
    const enrichedData = await enrichmentServer.enrichCompany({
      cnpj: '00.000.000/0001-91',
      companyName: 'Empresa Exemplo',
      includeLinkedIn: true,
    });

    console.log('Enriched Data:', {
      sources: enrichedData.sources,
      cnpj: enrichedData.cnpj?.razaoSocial,
      places: enrichedData.places?.name,
      linkedin: enrichedData.linkedin?.name,
      enrichmentDate: enrichedData.enrichmentDate,
    });
  } catch (error) {
    console.error('Company enrichment failed:', error);
  }
}

// Run examples
exampleUsage().catch(console.error);
