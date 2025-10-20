import {defineConfig} from 'vitepress'
import {withMermaid} from "vitepress-plugin-mermaid";

let reportPath = '/report'
let needFinding = reportPath + '/needFinding'
// https://vitepress.dev/reference/site-config


export default withMermaid(
    defineConfig({
        base: '/Spot-GO/',
        title: "Spot-GO",
        description: "manca la descrizione :( :(",
        themeConfig: {
            // https://vitepress.dev/reference/default-theme-config
            nav: [
                {text: 'Home', link: '/'},
            ],

            sidebar: [
                {
                    text: 'Report',
                    items: [
                        {text: 'Intro', link: `${needFinding}/0-Intro`},
                        {text: 'Methodology', link: `${needFinding}/1-Methodology`},
                        {text: 'Result', link: `${needFinding}/2-Results`},
                        {text: 'User needs', link: `${needFinding}/3-UserNeeds`},
                        {text: 'Solutions', link: `${needFinding}/4-Solutions`},
                        {text: 'Project name and value proposition', link: `${needFinding}/5-ProjectNameAndValueProposition`},
                    ]
                },
                {
                    text: 'Attacks',
                    items: [
                        {
                            text: 'NeedFinding',
                            collapsed: true,
                            items: [
                                // {text: '1-Meeting', link: `${scopingPath}/1-meeting`},
                                // {text: '2-Meeting', link: `${scopingPath}/2-meeting`},
                                // {text: '3-Meeting', link: `${scopingPath}/3-meeting`},
                                // {text: 'Market Analysis', link: `${scopingPath}/Market-Analysis`},
                                // {text: 'POS', link: `${scopingPath}/POS`},
                                // {text: 'Risk Analysis', link: `${scopingPath}/Risk-Analysis`},
                                // {text: 'Feasibility studies', link: `${scopingPath}/Feasibility-Studies`},
                                // {text: 'RBS', link: `${scopingPath}/RBS`},
                                // {text: 'SWOT Analysis', link: `${scopingPath}/SWOT-Analysis`},
                            ]
                        },
                        // {
                        //     text: 'Planning',
                        //     collapsed: true,
                        //     items: [
                        //         {text: 'WBS', link: `${planningPath}/WBS`},
                        //         {text: 'PND', link: `${planningPath}/PND`},
                        //         {text: 'Gantt', link: `${planningPath}/Gantt`},
                        //         {text: 'RBS', link: `${planningPath}/RBS`},
                        //         {text: 'Risk Management', link: `${planningPath}/Risk-Management-Plan`},
                        //     ]
                        // }
                    ]
                }
            ],

            socialLinks: [
                {icon: 'github', link: 'https://github.com/JBmanu/AthenaPlay-PM'}
            ]
        }
    })
)
