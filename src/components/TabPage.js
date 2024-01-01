import Tab from "react-bootstrap/Tab"
import Nav from "react-bootstrap/Nav"
import Card from "react-bootstrap/Card"

import FridgeSelect from "./ConfigTabs/FridgeSelect"
import WiringConfiguration from "./ConfigTabs/WiringConfiguration"
import StaticPlotting from "./ConfigTabs/StaticPlotting"
import FridgeConfig from "./ConfigTabs/FridgeConfig"
import SweepPlotting from "./ConfigTabs/SweepPlotting"

import {useState} from "react"

function TabPage() {
    const [fridge, setFridge] = useState({})   
    const [presetStages, setPresetStages] = useState()
    const [fridgeSelected, setFridgeSelected] = useState(false)
    const [fridgeConfigured, setFridgeConfigured] = useState(false)
    const [tab, setTab] = useState("fridgeSelection")
    const [pyodide, setPyodide] = useState(null)

    return(
        <div style={{width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>             
            <Card style={{width: "95%", height: "95%"}}>
                <Tab.Container id="configTabs" defaultActiveKey="fridgeSelection" activeKey={tab} onSelect={key => setTab(key)} justify>
                    <Nav variant="pills" justify>
                        <Nav.Item>
                            <Nav.Link eventKey="fridgeSelection">Fridge Selection</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="fridgeConfiguration" disabled={!fridgeSelected}>Fridge Configuration</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="wiringConfiguration" disabled={!fridgeConfigured}>Wiring Configuration</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="plotting" disabled={!fridge.cables || fridge.cables.length <= 0}>Static Plotting</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="sweepPlotting" disabled={!fridge.cables || fridge.cables.length <= 0}>Sweep Plotting</Nav.Link>
                        </Nav.Item>
                    </Nav>
                    <hr style={{margin: "0"}}/>
                    <Tab.Content style={{height: "100%", overflow: "hidden"}}>
                        <Tab.Pane style={{height: "100%"}} eventKey="fridgeSelection">
                            <FridgeSelect fridge={fridge} setFridge={setFridge} tab={tab} setTab={setTab} setFridgeSelected={setFridgeSelected} pyodide={pyodide} setPyodide={setPyodide} setPresetStages={setPresetStages}/>
                        </Tab.Pane>
                        <Tab.Pane style={{height: "100%"}} eventKey="fridgeConfiguration">
                            {/* NOTE: This is rendered conditionally, as it will crash if the 'fridge.current' prop is null */}
                            {fridge && tab === "fridgeConfiguration" && <FridgeConfig fridge={fridge} setFridge={setFridge} fridgeSelected={fridgeSelected} setTab={setTab} setFridgeConfigured={setFridgeConfigured} presetStages={presetStages}/>}
                        </Tab.Pane>
                        <Tab.Pane style={{height: "100%"}} eventKey="wiringConfiguration">
                            {fridge && tab === "wiringConfiguration" && <WiringConfiguration fridge={fridge} setFridge={setFridge} setTab={setTab}/>}
                        </Tab.Pane>
                        <Tab.Pane style={{height: "100%"}} eventKey="plotting">
                            {fridge && fridge.cables && tab === "plotting" && <StaticPlotting fridge={fridge} setFridge={setFridge} tab={tab} setTab={setTab} pyodide={pyodide}/>}
                        </Tab.Pane>
                        <Tab.Pane style={{height: "100%"}} eventKey="sweepPlotting">
                            {fridge && fridge.cables && <SweepPlotting fridge={fridge} setFridge={setFridge} tab={tab} setTab={setTab} pyodide={pyodide} currentTab={tab} />}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Card> 
        </div>  
    )
}

export default TabPage