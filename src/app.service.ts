import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import $ from 'cheerio';
import rp from 'request-promise';
import errors from 'request-promise/errors';
import ignite from 'apache-ignite-client';
import crypto from 'crypto-js';
import moment from 'moment';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  async getHello(): Promise<object> {
    const data = JSON.parse(await this.getFromCache());
    this.logger.log("Get BBC Audio list","GettingResource");
    return data;
  }

  private async getFromCache(): Promise<string> {
    const client = new ignite();

    try {
      await client.connect(new ignite.IgniteClientConfiguration(process.env.BASE_IGNITE));
      const cache = await client.getCache('thirdPartyCaches');
      const dataEncrypted = await cache.get('api-bbc');
      
      const secret = process.env.CACHE_SECRET;
      const decrypted = crypto.AES.decrypt(dataEncrypted, secret);
      const originalText = decrypted.toString(crypto.enc.Utf8);

      // console.log(originalText);
      return originalText;
    }
    catch (err) {
      console.log(err.message);
    }
    finally {
      client.disconnect();
    }
  }


  // @Cron('*/5 * * * * *')
  @Cron('00 30 06 * * *')
  async getResource(): Promise<void> {
    const arrayAudioInString = await this.getFromUrl();
    const toReturn = JSON.parse(
      `{
        "success": true,
        "message": "BBC Audio Found",
        "data": ${arrayAudioInString}
      }`);
      
    await this.setToIgnite(JSON.stringify(toReturn));
    this.logger.log("succesfully save BBC","SavingResource");
    // return toReturn;
  }

  private async getFromUrl(): Promise<string> {
    const options = {
      uri: 'http://podcasts.files.bbci.co.uk/p02pc9v6.rss',
      xml: true
    }

    const a = await rp(options)
      .then(xml => {
        const html = $.load(xml).xml();
        const tmpDate = moment($('itunes\\:image > pubdate', html).text()).toISOString();
        
        const tmp: string[] = [];
        for(let i=0;i<5;i++){
          tmp.push($('atom\\:link > item > enclosure', html).eq(i).attr('url'));
        }

        const final = `{
          "lastUpdate": "${tmpDate}",
          "audio": ${JSON.stringify(tmp)}
        }`

        return final;
      })
      .catch(errors.TransformError, function (reason) {
        console.log(reason.cause.message);
        throw new Error('cannot parse');
      });
      
    return a;
  }

  private async setToIgnite(data: string): Promise<any> {
    const client = new ignite();

    try {
      await client.connect(new ignite.IgniteClientConfiguration(process.env.BASE_IGNITE));
      const cache = (await client.getOrCreateCache('thirdPartyCaches')).setKeyType(ignite.ObjectType.PRIMITIVE_TYPE.STRING);
      
      const secret = process.env.CACHE_SECRET;
      const toCrypt = data;
      const encrypted = crypto.AES.encrypt(toCrypt, secret).toString();
      await cache.put('api-bbc', encrypted);
    }
    catch (err) {
      console.log(err.message);
      throw new Error('cannot save to cache');
    }
    finally {
      client.disconnect();
    }
  }
}
