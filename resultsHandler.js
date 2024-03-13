import fs from 'node:fs'

const config = JSON.parse(fs.readFileSync('./inputConfigs.json'))

const getCommaSeperatedValues = (result) => {
    const fields = config.individual_fields
    var values = ""

    fields.map(fieldName => {
        const matchingKey = Object.keys(result.fields).find(key => key.includes(fieldName));
        if (matchingKey !== undefined) {
            appendValue(result.fields[matchingKey][0])
        } else {
          appendValue("null")
        }
      })

      function appendValue(value) {
        if(values === "") {
            values += value
        } else {
            values += "," + value
        }
      }

    return values
}

const loadKeysFromConfig = () => {
    var commaSeperatedFields = ""
    const fields = config.individual_fields
    fields.forEach(field => {
        if(commaSeperatedFields === "") {
            commaSeperatedFields += field
        } else {
            commaSeperatedFields += "," + field
        }
    })
    return commaSeperatedFields
}

export const createResultFile = () => {
    const filePath = './results.csv'

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File does not exist, creating new..')
            appendResult(loadKeysFromConfig())
            return
        }

        // if file exists
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error while trying to remove the file:', err)
                process.exit(1)
            }
            console.log('Existing file removed successfully, creating new..')
            appendResult(loadKeysFromConfig())
        });
    });

}

const appendResult = async (dataRow) => {
    try {
        console.info("Appending data to file...")
        dataRow += "\r\n"
        fs.appendFileSync('./results.csv', dataRow)
        console.info("Data inserted!")
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

export const handleResult = async (result) => {
    await appendResult(getCommaSeperatedValues(result))
}