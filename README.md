**Pacman Contribution Graph**  
Transform your GitHub contribution graph into an pacman game! This JavaScript library offers a unique and engaging way to visualize your coding activity over the past year.  
**🕹️ Available Game**  
| | | |  
|-|-|-|  
| **Game** | **Game Name** | **Description** |   
| 👻 **Pac-Man** | pacman | Steve eats your contributions while navigating the graph |   
   
**Pac-Man preview**  
   
**🎮 Features**  
Elevate your GitHub profile with the Pac-Man Contribution Graph Game and add a playful touch to your coding journey!  
- **Contribution Visualization**: Converts your GitHub contribution data into a colorful grid.  
- **Multiple Themes**: Choose between different themes, such as GitHub Dark.  
- **Customizable Settings**: Adjust game settings.  
- **GitHub Integration**: Automatically fetches your contribution data via GraphQL API  
- **GitHub Action**: Easy to add to your profile or website README  
**🔧 Installation**  
To integrate the Pac-Man Contribution Graph into your project, you can install it via npm:  
npm install save-steve  
   
Alternatively, include it directly in your HTML using jsDelivr:  
<script src="https://cdn.jsdelivr.net/npm/save-steve/dist/save-steve.min.js"></script>  
   
**🧩 Usage**  
Here's how to set up and run the games:  
1. **Include the Library**: Ensure the library is included in your project, either via npm or a script tag.  
2. **Initialize the Game**: Use the following code to generate an arcade game:  
3. import { ArcadeRenderer } from 'save-steve';  
   
 const renderer = new ArcadeRenderer({  
     game: 'pacman',  
     username: 'G0DBeasT',  
     platform: 'github',  
     gameTheme: 'github-dark', // 'github' or 'github-dark'  
     playerStyle: 'opportunistic', // Pac-Man only: 'conservative', 'aggressive', or 'opportunistic'  
     svgCallback: (svg) => {  
         // called with the generated SVG string  
         document.getElementById('output').innerHTML = svg;  
     },  
     gameOverCallback: () => {  
         console.log('Game over!');  
     },  
     pointsIncreasedCallback: (points) => {  
         console.log('Score:', points);  
     }  
 });  
 renderer.start();  
   
4. **Customize Settings**: Adjust the parameters as needed:  
  - username: Your GitHub username (G0DBeasT).  
  - gameTheme: Choose between 'github' or 'github-dark'.  
**CLI**  
***Basic***  
save-steve --game pacman --username G0DBeasT --platform github --gameTheme github --output pacman-contribution-graph.svg  
   
**Integrate into Your GitHub Profile**  
To showcase the Pac-Man game on your GitHub profile, follow these steps:  
1. **Create a Special Repository**:  
  - Name a new repository exactly as your GitHub username (G0DBeasT/G0DBeasT).  
  - This repository powers your GitHub profile page.  
2. **Set Up GitHub Actions**:  
  - In the repository, create a .github/workflows/ directory.  
  - Add a main.yml file with the following content:  
  - name: generate arcade contribution graphs  
   
 on:  
     schedule: # Run automatically every 24 hours  
         - cron: '0 0 * * *'  
     workflow_dispatch: # Allows manual triggering  
     push: # Runs on every push to the main branch  
         branches:  
             - main  
   
 jobs:  
     generate:  
         permissions:  
             contents: write  
         runs-on: ubuntu-latest  
         timeout-minutes: 20  
   
         steps:  
             - name: generate contribution graph SVGs  
               uses: G0DBeasT/save_steve@master  
               with:  
                   github_user_name: ${{ github.repository_owner }}  
                   games: 'pacman'  
   
             # Push the generated SVGs to the output branch  
             - name: push SVGs to the output branch  
               uses: crazy-max/ghaction-github-pages@v3.1.0  
               with:  
                   target_branch: output  
                   build_dir: dist  
               env:  
                   GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  
   
3. **Add to Profile README**:  
  - In your repository, create or edit the README.md file to include:  
  - ## My Contribution Graph  
   
 <!-- pacman -->  
 <picture>  
     <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/G0DBeasT/G0DBeasT/output/pacman-contribution-graph-dark.svg">  
     <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/G0DBeasT/G0DBeasT/output/pacman-contribution-graph.svg">  
     <img alt="pacman contribution graph" src="https://raw.githubusercontent.com/G0DBeasT/G0DBeasT/output/pacman-contribution-graph.svg">  
 </picture>  
[contributors-shield]: https://img.shields.io/github/contributors/G0DBeasT/save_steve.svg?style=for-the-badge
[contributors-url]: https://github.com/G0DBeasT/save_steve/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/G0DBeasT/save_steve.svg?style=for-the-badge
[forks-url]: https://github.com/G0DBeasT/save_steve/network/members
[stars-shield]: https://img.shields.io/github/stars/G0DBeasT/save_steve.svg?style=for-the-badge
[stars-url]: https://github.com/G0DBeasT/save_steve/stargazers
   
4. **Commit and Push**:  
  - Push the changes to GitHub. The GitHub Actions workflow will run daily, updating the Pac-Man game on your profile.  
**⏳ Run the Workflow Manually**  
Once you have everything set up:  
- Go to the "Actions" tab in your repository  
- Click "Update Pac-Man Contribution"  
- Click "Run workflow" > "Run workflow"  
This will start the SVG generation process and you will then be able to see the animation working in your README!  
   
 This implementation will allow your Pac-Man contribution graph to be automatically updated every day, keeping it always up to date with your latest contributions.  
**🎯 How it Works**  
The application uses your GitHub contribution data to:  
1. Create a grid where each cell represents a day of contribution  
2. Pac-Man (Steve) navigates the grid using pathfinding algorithms  
3. All gameplay is recorded and exported as an animated SVG  
