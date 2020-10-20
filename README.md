# API BBC Indonesia

## Description

API that collect available podcast's audio that publicly provided by BBC Indonesia then save the result in DB for faster access. This API do the job every day at 06.30 +0700

## Running the app

If you want to use PM2, build and run it with docker. I've provided the Dockerfile. Or you can use npm command below:

```bash
# development
$ npm run start

# production mode
$ npm run start:prod
```

## Fetching Resources

This API fetching the data with following steps:
1. Get XML-formatted data from `http://podcasts.files.bbci.co.uk/p02pc9v6.rss`
2. Parse it with Cheerio
3. Get audio's url tag
4. Save urls to PostgresDB and Ignite 

These steps will be executed once a day at 06.30 +0700 using Cron Job.

## Get Data

Request (GET) :
```
http://localhost/
```
Request (GET) with custom PORT, (ex: 8080) :
```
http://localhost:8080
```

Response success (200) :
```json
{
  "success": true,
  "message": "BBC Audio Found",
  "data": [... audios]
}
```