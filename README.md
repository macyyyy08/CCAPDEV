# Restaurant / Store / Service Review Web Application

TaftChoice is a web application designed specifically for DLSU students and anyone in Taft who seeks delicious food options within Agno Compound. Making decisions on where to dine can be daunting and tiring, especially for busy students. The app's goal is to simplify this process by providing a comprehensive platform where users can easily access reviews and essential information about food stalls in Agno.


### Prerequisites:
- Make sure that Node.js installed on your local machine. You can download it from [Node.js official website](https://nodejs.org/).
- Make sure that you have MongoDB installed on your local machine, alongside the mongoose library.

### Running the Application:
1. After the installation of dependencies, start the Node.js server by running:

npm init
npm i express express-handlebars body-parser mongoose
node app.js

2. Once the server is running, you can access the application by opening a web browser and navigating to `http://localhost:PORT`, where `PORT` is the port number specified in the `app.js` file or by default, it could be `3000`.

3. You should now see the application running locally on your machine.


### Usage:
- Use the application to view and interact with the reviews data provided.

### Additional Notes:
- Make sure no other service is running on the specified port to avoid conflicts.
- You can customize the port number by modifying the `app.js` file if needed.
- Ensure that the provided JSON data is accessible to the application through appropriate methods (e.g., API endpoint, local file read).

If you encounter any issues or have questions, feel free to reach out for assistance.