import { Injectable } from '@nestjs/common';

import * as cheerio from 'cheerio';

@Injectable()
export class ScrapingService {
  async buscarIvrea(
    titulo: string,
  ) {
    try {
      const query =
        encodeURIComponent(
          titulo,
        );

      const response =
        await fetch(
          `https://www.ivrea.com.ar/?s=${query}`,
        );

      const html =
        await response.text();

      const $ =
        cheerio.load(html);

      const resultados: any[] =
        [];

      $('.post').each(
        (_, element) => {
          const nombre =
            $(element)
              .find('h2')
              .text()
              .trim();

          const link =
            $(element)
              .find('a')
              .attr('href');

          resultados.push({
            nombre,
            link,
          });
        },
      );

      console.log(
        'SCRAPING IVREA:',
        resultados,
      );

      return resultados;
    } catch (error) {
      console.log(error);

      return [];
    }
  }
  
  async buscarNorma(
    titulo: string,
  ) {
    try {
      const response =
        await fetch(
          'https://www.normaeditorial.com/catalogo/manga',
        );

      const html =
        await response.text();

      const encontrado =
        html
          .toLowerCase()
          .includes(
            titulo.toLowerCase(),
          );

      console.log(
        'NORMA ENCONTRADO:',
        titulo,
        encontrado,
      );

      return encontrado;
    } catch (error) {
      console.log(error);

      return false;
    }
  }

  async buscarPlaneta(
  titulo: string,
) {
  try {
    const url =
      `https://www.planetadelibros.com/?buscar=${encodeURIComponent(
        titulo,
      )}`;

    const response =
      await fetch(url);

    const html =
      await response.text();

    console.log(
      'PLANETA HTML LENGTH:',
      html.length,
    );

    console.log(
      'TIENE NARUTO:',
      html.includes('Naruto'),
    );

    const urls =
      html.match(
        /https:\/\/www\.planetadelibros\.com\/[^\"]+/g,
      ) || [];

    console.log(
      'URLS ENCONTRADAS:',
      urls.slice(0, 20),
    );

    return null;
    
  } catch (error) {
    console.log(error);

    return null;
  }
  }

}