import { Client } from "@opensearch-project/opensearch"
import AWS from 'aws-sdk'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'
import fs from 'node:fs'
import { handleResult, createResultFile } from './resultsHandler.js'
import dotenv from 'dotenv'
dotenv.config()

var initialRun = true
var inputConfigs = {}
var resultSetCount = 0;

const client = new Client({
    ...AwsSigv4Signer({
        service: "es",
        region: "eu-north-1",
        getCredentials: () =>
            new Promise((resolve, reject) => {
                AWS.config.getCredentials((err, credentials) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(credentials);
                    }
                });
            })
    }),
    node: process.env.NODE
})

const fetchFromES = async () => {
    if (initialRun) {
        console.info("Loading and parsing the input configurations..")
        try {
            inputConfigs = JSON.parse(fs.readFileSync('./inputConfigs.json'))
            createResultFile()
            console.info("Input configurations successfully loaded!")
            initialRun = false
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
    }

    console.info("Sending the search request..")
    try {
        const res = await client.search(
            {
                index: inputConfigs.index,
                body: inputConfigs.queryToSearch
            }
        )

        const totalHits = res.body.hits.total.value
        const docsCount = res.body.hits.hits.length
        resultSetCount += 1
        console.info("Response received, Total hits: ", totalHits, " Total docs: ", docsCount)

        if (docsCount <= 0) {
            console.info("All results are fetched, closing the application..")
            process.exit(1)
        }

        console.info("Processing result set: ", resultSetCount)
        res.body.hits.hits.forEach(result => {

            handleResult(result)

            console.info("Modifying query..")
            inputConfigs.queryToSearch.search_after = result.sort
            console.info("Search after: ", inputConfigs.queryToSearch.search_after)
        });

        console.info("Complete processing result set: ", resultSetCount, " Fetching next..")
        fetchFromES()
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}


fetchFromES()