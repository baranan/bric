$(document).ready(function() {
    let csvData = [];

    function readCSV(file, callback) {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                callback(results.data);
            }
        });
    }

    function mergeCSVData(data1, data2, data3) {
        let mergedData = {};
        let allKeys = new Set();

        // Collect all unique keys from all datasets
        [data1, data2, data3].forEach(data => {
            data.forEach(row => {
                Object.keys(row).forEach(key => allKeys.add(key));
            });
        });

        // Merge data
        [data1, data2, data3].forEach(data => {
            data.forEach(row => {
                if (!mergedData[row.prime]) {
                    mergedData[row.prime] = { name: row.prime }; // Add photoName
                }
                Object.assign(mergedData[row.prime], row);
                delete mergedData[row.prime].prime; // Remove prime from the merged data
            });
        });

        // Remove "prime" from allKeys
        allKeys.delete("prime");

        // Ensure all rows have all keys
        let allKeysArray = Array.from(allKeys);
        Object.values(mergedData).forEach((row, index) => {
            let missingKeys = [];
            allKeysArray.forEach(key => {
                if (!row.hasOwnProperty(key)) {
                    row[key] = null; // or any default value
                    missingKeys.push(key);
                } else if (!isNaN(row[key])) {
                    row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); // Round to three decimal places
                }
            });
            if (missingKeys.length > 0) {
                console.log(`Row ${index + 1} is missing keys: ${missingKeys.join(', ')}`);
            }
        });

        // Filter out rows with no data
        let filteredData = Object.values(mergedData).filter(row => {
            return Object.values(row).some(value => value !== null && value !== "");
        });

        return filteredData;
    }

    // Ensure createTable is in the global scope
     window.mergeCSVData = mergeCSVData;

    function createTable(data) {
        // Define a hardcoded order for the columns
        const hardcodedOrder = ['slow_mean_continuous', 'slow_mean_binary', 'fast_mean_continuous', 'fast_mean_binary', "g_score_mean", 'arousal_mean', 'fast900_mean_continuous', 'fast1200_mean_continuous', 'fast1500_mean_continuous', 'fast1800_mean_continuous', 'fast900_mean_binary', 'fast1200_mean_binary', 'fast1500_mean_binary', 'fast1800_mean_binary'];

        // Get the columns from the data
        let columns = Object.keys(data[0]).map(key => ({ title: key, data: key }));

        // Reorder the columns based on the hardcoded order
        columns.sort((a, b) => {
            let indexA = hardcodedOrder.indexOf(a.data);
            let indexB = hardcodedOrder.indexOf(b.data);
            if (indexA === -1) indexA = hardcodedOrder.length;
            if (indexB === -1) indexB = hardcodedOrder.length;
            return indexA - indexB;
        });

        // Add the new column for photo name at the beginning
        columns.unshift({ title: "Name", data: "name" });

        // Insert the Photo column after the Photo Name column
        columns.splice(1, 0, {
            title: "Photo",
            data: "name", // Use photoName instead of prime
            render: function(data) {
                if (data) {
                    return `<img src="images/${data}.jpg" alt="Photo" style="width:100px;" class="clickable-photo">`;
                } else {
                    return 'No Photo';
                }
            }
        });

        // Clear and destroy the existing DataTable if it exists
        if ($.fn.DataTable.isDataTable('#photoTable')) {
            $('#photoTable').DataTable().clear().destroy();
        }

 

        // Initialize the DataTable with the columns and data
        $('#photoTable').DataTable({
            data: data,
            columns: columns,
            colReorder: true, // Enable column reordering
            pageLength: 100 // Set the default number of shown entries to 100
        });

        // Add click event listener for the photos
        $('#photoTable tbody').off('click', 'img.clickable-photo').on('click', 'img.clickable-photo', function() {

            console.log("Photo clicked"); // Debugging: Log when a photo is clicked
            
            const modal = document.getElementById("myModal");
            const modalImg = document.getElementById("img01");
            const captionText = document.getElementById("caption");

            modal.style.display = "block";
            modalImg.src = this.src;
            captionText.innerHTML = this.alt;

            // Get the <span> element that closes the modal
            const span = document.getElementsByClassName("close")[0];

            // When the user clicks on <span> (x), close the modal
            span.onclick = function() {
                modal.style.display = "none";
            }

            // When the user presses the Esc key, close the modal
            document.onkeydown = function(event) {
                if (event.key === "Escape" || event.key === "Esc") {
                    modal.style.display = "none";
                }
            }
        });
    }

    // Ensure createTable is in the global scope
    window.createTable = createTable;

    $('#loadData').click(function() {
        let files = [
            document.getElementById('csvFile1').files[0],
            document.getElementById('csvFile2').files[0],
            document.getElementById('csvFile3').files[0]
        ];

        if (files.every(file => file)) {
            let dataPromises = files.map(file => new Promise(resolve => readCSV(file, resolve)));
            Promise.all(dataPromises).then(results => {
                csvData = mergeCSVData(...results);
                createTable(csvData);
            });
        } else {
            alert("Please select all three CSV files.");
        }
    });
});