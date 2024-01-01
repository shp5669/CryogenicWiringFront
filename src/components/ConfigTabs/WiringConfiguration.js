import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Dropdown from 'react-bootstrap/Dropdown'
import { useState, useEffect } from 'react'
import {produce} from 'immer'
import { attenuatorConstructor } from '../../model/attenuator'
import {cableFactory, cableList, customCableFactory } from '../../model/cable'

function WiringConfiguration(props) {
    const [customName, setCustomName] = useState("") //Custom name for saving preset into memory
    const [show, setShow] = useState(false) //Should we show the modal for editing the cable?
    const [cableIndex, setCableIndex] = useState(0) //Which cable should be shown in the modal? 
    const [latestAttenuation, setLatestAttenuation] = useState(20)
    const [presets, setPresets] = useState(localStorage.getItem('wiringConfigs') ? JSON.parse(localStorage.getItem('wiringConfigs')) : {presets : []})
    const [customCables, setCustomCables] = useState(localStorage.getItem('customCables') ? JSON.parse(localStorage.getItem('customCables')) : {cables : []})

    const [showModal, setShowModal] = useState(false)
    const [showNewModal, setShowNewModal] = useState(false)
    
    //Variables for creating a 'custom' material type
    const [matName, setMatName] = useState("")
    const [matNameValid, setMatNameValid] = useState(false)
    const [matDiams, setMatDiams] = useState([0, 0, 0])
    const [matDiamsValid, setMatDiamsValid] = useState([false, false, false])
    const [matThermCondCoaxco, setMatThermCondCoaxco] = useState([0, '119'])
    const [matThermCondCoaxcoValid, setMatThermCondCoaxcoValid] = useState(true)
    const [matCAtt300Coaxco, setMatCAtt300Coaxco] = useState([0, 0, 0, 0, 0])
    const [matCAtt300CoaxcoValid, setMatCAtt300CoaxcoValid] = useState([true, true, true, true, true])
    const [matCAtt4Coaxco, setMatCAtt4Coaxco] = useState([0, 0, 0, 0, 0])
    const [matCAtt4CoaxcoValid, setMatCAtt4CoaxcoValid] = useState([true, true, true, true, true])
    const [matRhoCoaxco, setMatRhoCoaxco] = useState(0)
    const [matRhoCoaxcoValid, setMatRhoCoaxcoValid] = useState(true)
    const [custAtt, setCustAtt] = useState(false)
    const [custAttText, setCustAttText] = useState(null)
    const [custAttTextValid, setCustAttTextValid] = useState(false)
    const [custCond, setCustCond] = useState(false)
    const [custCondText, setCustCondText] = useState(null)
    const [custCondTextValid, setCustCondTextValid] = useState(false)
    //Validity for cable signal form (their states are contained within the fridge object)
    const [quantityValid, setQuantityValid] = useState(false)
    const [inputSignalPowerValid, setInputSignalPowerValid] = useState(false)
    const [dutyCycleValid, setDutyCycleValid] = useState(true)
    const [inputSignalFrequencyValid, setInputSignalFrequencyValid] = useState(false)
    const [inputCurrentValid, setInputCurrentValid] = useState(false)

    //For checking if the signals and materials are valid, and preventing saving/closing the modal if not
    const [signalValid, setSignalValid] = useState(false)
    const [materialValid, setMaterialValid] = useState(false)
    //TODO: useEffect validation for cable signal
    useEffect(() => {
        if(quantityValid && inputSignalPowerValid && inputSignalFrequencyValid && inputCurrentValid) setSignalValid(true)
        else setSignalValid(false)
    }, [quantityValid, inputSignalPowerValid, inputSignalFrequencyValid, inputCurrentValid])
    //TODO: useEffect validation for new material isInvalid={true}
    useEffect(() => {
        if(matNameValid && matDiamsValid.every(v => v) && matThermCondCoaxcoValid && matCAtt300CoaxcoValid.every(v => v) && matCAtt4CoaxcoValid.every(v => v) && matRhoCoaxcoValid && custAttTextValid && custCondTextValid) setMaterialValid(true)
        else setMaterialValid(false)
    }, [matNameValid, matDiamsValid, matThermCondCoaxcoValid, matCAtt300CoaxcoValid, matCAtt4CoaxcoValid, matRhoCoaxcoValid, custAttTextValid, custCondTextValid])

    useEffect(() => {
        localStorage.setItem('wiringConfigs', JSON.stringify(presets))
    }, [presets])
    useEffect(() => {
        localStorage.setItem('customCables', JSON.stringify(customCables))
    }, [customCables])
    const colCount = props.fridge.cables.length 
    //1 column for stage names, 1 column for each cable type, 1 column for adding new cables
    //Every 'cable column' should have an equal width (1fr), while the others are as small as possible (auto)

    //Manually sets thermalisation for a cable at a specific stage
    function setThermalisationOverride(cable, stage, layer, value) {
        props.setFridge(produce(fridge => {
            fridge.cables[cable].thermalisationOverride[stage][layer] = value
        }))
    }
    
    //Calculates the thermalisation based upon attachments for all cables
    //Then changes to the next tab
    function calculateThermalisation(cable) {
        props.setFridge(produce(fridge => {
            for(let cable in fridge.cables) {
                if(fridge.cables[cable].overriding) fridge.cables[cable].thermalisation = fridge.cables[cable].thermalisationOverride
                else {
                    for(let cableStage in fridge.cables[cable].thermalisation) {
                        //Thermalise outer by default
                        fridge.cables[cable].thermalisation[cableStage][2] = true
                        //All thermalised if there's an attenuator
                        if(fridge.cables[cable].attenuators[cableStage] !== null) fridge.cables[cable].thermalisation[cableStage] = [true, true, true]
                    }
                }
            }
        }))
        props.setTab("plotting")
    }


    //Note: 'e.target.value' is sometimes multiplied by one to prevent it from being stored as a string
    return(
        <div style={{display: "flex", flexDirection: "column", height: "100%", padding: "0.5em"}}>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>Save Wiring Configuration</Modal.Header>
                <Modal.Body>
                    <Form.Control type="text" placeholder="Custom Preset Name" value={customName} onChange={event => setCustomName(event.target.value)}/>
                    <Button disabled={colCount <= 0} style={{width: "100%"}} variant="success" onClick={() => {
                        let configs = JSON.parse(localStorage.getItem('wiringConfigs')) ?? {presets : []}
                        let preset = {
                            name: customName,
                            cables: props.fridge.cables.map(cable => {
                                return cable
                            })
                        }

                        for(let i in configs.presets) {
                            if(configs.presets[i].name === preset.name) {
                                configs.presets.splice(i, 1)
                            }
                        }

                        configs.presets.push(preset)
                        localStorage.setItem('wiringConfigs', JSON.stringify(configs))
                        setShowModal(false)
                        setPresets(localStorage.getItem('wiringConfigs') ? JSON.parse(localStorage.getItem('wiringConfigs')) : {presets : []})
                    }}>
                        Save As Custom Layout
                    </Button>
                </Modal.Body>
            </Modal>
            <Modal show={showNewModal} onHide={() => setShowNewModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Cable Material</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Label>Material Name</Form.Label>
                    <Form.Control placeholder="Enter the material name here" value={matName} isInvalid={!matNameValid} onChange={e => {setMatName(e.target.value); setMatNameValid(e.target.value !== "")}}/>
                    <Form.Label>Diameters (Inner., Die., Outer.)</Form.Label>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr"}}>
                        {matDiams.map((diam, i) => <Form.Control type="number" isInvalid={!matDiamsValid[i]} value={matDiams[i].toString()} onChange={e =>  setMatDiams(produce(mat => {
                            let newVal = parseFloat(e.target.value)
                            mat[i] = newVal
                            setMatDiamsValid(produce(valid => {valid[i] = newVal > 0}))
                        }))}/>)}
                    </div>
                    <Form.Label>ThermCondCoaxco</Form.Label>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
                        <Form.Control type="number" isInvalid={!matThermCondCoaxcoValid} value={matThermCondCoaxco[0].toString()} onChange={e => setMatThermCondCoaxco(produce(val => {
                            let newVal = parseFloat(e.target.value)
                            val[0] = newVal
                            setMatThermCondCoaxcoValid(newVal >= 0)
                        }))}/>
                        <Form.Select  onChange={e => setMatThermCondCoaxco(produce(val => {val[1] = e.target.value}))}>
                            <option value="119">119</option>
                            <option value="219">219</option>     
                        </Form.Select>
                    </div>
                    <Form.Label>cAtt300Coaxco</Form.Label>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr"}}>
                        {matCAtt300Coaxco.map((diam, i) => <Form.Control type="number" isInvalid={!matCAtt300CoaxcoValid[i]} value={matCAtt300Coaxco[i].toString()} onChange={e =>  setMatCAtt300Coaxco(produce(mat => {
                            let newVal = parseFloat(e.target.value)
                            mat[i] = newVal
                            setMatCAtt300CoaxcoValid(produce(valid => {valid[i] = newVal >= 0}))
                        }))}/>)}
                    </div>
                    <Form.Label>cAtt4Coaxco</Form.Label>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr"}}>
                        {matCAtt4Coaxco.map((diam, i) => <Form.Control type="number" isInvalid={!matCAtt4CoaxcoValid} value={matCAtt4Coaxco[i]} onChange={e =>  setMatCAtt4Coaxco(produce(mat => {
                            let newVal = parseFloat(e.target.value)
                            mat[i] = newVal
                            setMatCAtt4CoaxcoValid(produce(valid => {valid[i] = newVal >= 0}))
                        }))}/>)}
                    </div>
                    <Form.Label>rhoCoaxco</Form.Label>
                    <Form.Control type="number" isInvalid={!matRhoCoaxcoValid} value={matRhoCoaxco.toString()} onChange={e => {
                        let newVal = parseFloat(e.target.value)
                        setMatRhoCoaxco(newVal)
                        setMatRhoCoaxcoValid(newVal >= 0)
                    }}/>
                    <Form.Check label="Custom Attenuation Function" type="switch" checked={custAtt} onChange={e => {setCustAtt(e.target.checked); setCustAttText(null); setCustAttTextValid(!e.target.checked)}} />
                    {
                        custAtt &&
                        <Form.Control placeholder="Enter Python expression for calculating custom attenuation" value={custAttText} isInvalid={!custAttTextValid} onChange={e => {setCustAttText(e.target.value); setCustAttTextValid(e.target.value !== "")}}/>
                    }
                    <Form.Check label="Custom Conductivity Function" type="switch" checked={custCond} onChange={e => {setCustCond(e.target.checked); setCustCondText(null); setCustCondTextValid(!e.target.checked)}} />
                    {
                        custCond &&
                        <Form.Control placeholder="Enter Python expression for calculating custom attenuation" value={custCondText} isInvalid={!custCondTextValid} onChange={e => {setCustCondText(e.target.value); setCustCondTextValid(e.target.value !== "")}}/>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <div style={{display: "grid", gridTemplateColumns: "1fr", width: "100%"}}>
                        <Button variant="success" disabled={!materialValid} onClick={() => {
                            let configs = JSON.parse(localStorage.getItem('customCables')) ?? {cables : []}
                            let newCable = {materialName: matName, materialDiams: matDiams.map(v => v*1), materialThermCondCoaxco: [matThermCondCoaxco[0]*1, matThermCondCoaxco[1]], materialCAtt300Coaxco: matCAtt300Coaxco.map(v => v*1), materialCAtt4Coaxco: matCAtt4Coaxco.map(v => v*1), materialRhoCoaxco: matRhoCoaxco*1}
                            for(let i in configs.cables) {
                                if(configs.cables[i].materialName === newCable.materialName) configs.cables.splice(i, 1)
                            }
                            configs.cables.push(newCable)
                            localStorage.setItem('customCables', JSON.stringify(configs))
                            setCustomCables(localStorage.getItem('customCables') ? JSON.parse(localStorage.getItem('customCables')) : {cables : []})
                            setShowNewModal(false)
                        }}>Save As Custom Cable</Button>
                    </div>
                    
                </Modal.Footer>
            </Modal>
            {props.fridge.cables.length > 0 && <Modal show={show} onHide={() => {if(signalValid) setShow(false)}}>
                <Modal.Header>
                    <Modal.Title>Edit Cable</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Label>Cable Name</Form.Label>
                    <Form.Control value={props.fridge.cables[cableIndex].name} onChange={(e) => props.setFridge(produce(fridge => {fridge.cables[cableIndex].name = e.target.value}))}/>
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control type="number" isInvalid={!quantityValid} value={props.fridge.cables[cableIndex].quantity.toString()} onChange={(e) => {
                        let newVal = parseInt(e.target.value)
                        props.setFridge(produce(fridge => {fridge.cables[cableIndex].quantity = newVal}));
                        setQuantityValid(newVal > 0)
                    }}/>
                    <br/>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
                        <Button onClick={(e) => props.setFridge(produce(fridge => {
                            fridge.cables[cableIndex].isAC = true; 
                            setInputSignalPowerValid(fridge.cables[cableIndex].inputSignalPower > 0)
                            setInputSignalFrequencyValid(fridge.cables[cableIndex].inputSignalFrequency > 0)
                            setInputCurrentValid(true)
                        }))}  variant={props.fridge.cables[cableIndex].isAC === true ? "primary" : "outline-primary"}>AC Signal</Button>
                        <Button onClick={(e) => props.setFridge(produce(fridge => {
                            fridge.cables[cableIndex].isAC = false 
                            setInputSignalPowerValid(true)
                            setInputSignalFrequencyValid(true)
                            setInputCurrentValid(fridge.cables[cableIndex].inputCurrent > 0)
                        }))}  variant={props.fridge.cables[cableIndex].isAC === false ? "primary" : "outline-primary"}>DC Signal</Button>
                    </div>
                        
                    {
                        props.fridge.cables[cableIndex].isAC 
                        ?
                        <>
                            <Form.Label>AC Input Signal Power (Watts)</Form.Label>
                            <Form.Control type="number" isInvalid={!inputSignalPowerValid} value={props.fridge.cables[cableIndex].inputSignalPower.toString()} onChange={(e) => props.setFridge(produce(fridge => {
                                let newVal = parseFloat(e.target.value)
                                fridge.cables[cableIndex].inputSignalPower = newVal
                                setInputSignalPowerValid(newVal > 0)
                            }))}/>
                            <Form.Label>Duty Cycle (0-1)</Form.Label>
                            <Form.Control type="number" isInvalid={!dutyCycleValid} value={props.fridge.cables[cableIndex].dutyCycle.toString()} onChange={(e) => props.setFridge(produce(fridge => {
                                let newVal = parseFloat(e.target.value)
                                fridge.cables[cableIndex].dutyCycle = newVal
                                setDutyCycleValid(newVal >= 0 && newVal <= 1)
                            }))}/>
                            <Form.Label>AC Input Signal Frequency (GHz)</Form.Label>
                            <Form.Control type="number" isInvalid={!inputSignalFrequencyValid} value={props.fridge.cables[cableIndex].inputSignalFrequency.toString()} onChange={(e) => props.setFridge(produce(fridge => {
                                let newVal = parseFloat(e.target.value)
                                if(newVal >= 20) newVal = 19.999
                                fridge.cables[cableIndex].inputSignalFrequency = newVal
                                setInputSignalFrequencyValid(newVal > 0)
                            }))}/>
                        </>
                        :
                        <>
                            <Form.Label>DC Input Current (Amps)</Form.Label>
                            <Form.Control type="number" isInvalid={!inputCurrentValid} value={props.fridge.cables[cableIndex].inputCurrent.toString()} onChange={(e) => props.setFridge(produce(fridge => {
                                let newVal = parseFloat(e.target.value)
                                fridge.cables[cableIndex].inputCurrent = newVal
                                setInputCurrentValid(newVal > 0)                                
                            }))}/>
                        </>
                    }
                    <br></br>
                    <Form.Check label="Thermalisation Table Overrides" checked={props.fridge.cables[cableIndex].overriding} type="switch" onChange={(event) => props.setFridge(produce(fridge => {
                        fridge.cables[cableIndex].overriding = event.target.checked  
                    }))}/>
                    {
                    props.fridge.cables[cableIndex].overriding && 
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr 1fr 1fr 1fr"}}>
                        <p>Inner</p>
                        <p>Dielectric</p>
                        <p>Outer</p>
                        {props.fridge.cables[cableIndex].thermalisationOverride && props.fridge.cables[cableIndex].thermalisationOverride.map((stage, index) => {
                            return stage.map((point, index2) => {
                                return point ? 
                                <Button variant="success" key={`${index}-${index2}`} disabled={!props.fridge.cables[cableIndex].overriding} onClick={() => setThermalisationOverride(cableIndex, index, index2, false)}>True</Button> 
                                : 
                                <Button variant="danger" disabled={!props.fridge.cables[cableIndex].overriding} onClick={() => setThermalisationOverride(cableIndex, index, index2, true)}>False</Button>
                            })})}
                    </div>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button style={{flex: 1}} disabled={!signalValid} onClick={() => setShow(false)}>
                        Close Form
                    </Button>
                    <Button variant="danger" onClick={() => {
                        setShow(false)
                        props.setFridge(produce(fridge => {
                            fridge.cables.splice(cableIndex, 1)
                        }))
                        setCableIndex(0)
                    }}>
                        🗑
                    </Button>
                </Modal.Footer>
            </Modal>}

            <div style={{display: "grid", gridTemplateColumns: "1fr auto", gap: "0.2em"}}>
                <Dropdown drop={"end"}>
                    <Dropdown.Toggle disabled={presets.presets.length === 0} style={{width: "100%"}} variant="success" id="preset-dropdown">
                        Use Saved Layout
                    </Dropdown.Toggle>

                    <Dropdown.Menu style={{maxHeight: "50vh", overflowY: "scroll"}}> 
                    {presets.presets.map((config, index) => 
                            <div key={config.name} style={{display: "flex", flexDirection: "row"}}>
                                <Dropdown.Item onClick={() => {
                                    let cables = []
                                    for(let i in presets.presets[index].cables) {
                                        cables.push(presets.presets[index].cables[i])
                                    }
                                    props.setFridge(produce(fridge => {
                                        fridge.cables = cables
                                    }))
                                }}>
                                    {config.name}
                                </Dropdown.Item>
                                <Button variant="danger" onClick={() => {
                                    setPresets(produce(presets => {
                                        presets.presets.splice(index, 1)
                                    }))                          
                                }}>
                                    🗑
                                </Button>
                            </div>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
                <Button disabled={colCount <= 0} variant="success" onClick={() => setShowModal(true)}>
                    Save As Custom Layout
                </Button>
            </div>

            <div style={{display: "grid", padding: "0.5em", gridGap: "0.2em", gridTemplateColumns: `auto ${"1fr ".repeat(Math.max(colCount, 1))} auto`, gridTemplateRows: `auto ${"1fr ".repeat(5)} auto`, flex: 1}}>
                
                {/* Top Row */}
                <p></p>
                {colCount === 0 && <div style={{gridRow: `1 / span ${props.fridge.stages.length + 1}`}}/>}
                {props.fridge.cables.map((cable, index) => 
                    
                        <Button key={index} onClick={() => {
                            setShow(true); 
                            setCableIndex(index)
                            setQuantityValid(props.fridge.cables[cableIndex].quantity)
                            setInputSignalPowerValid(props.fridge.cables[cableIndex].isAC ? props.fridge.cables[cableIndex].inputSignalPower >= 0 : true)
                            setInputSignalFrequencyValid(props.fridge.cables[cableIndex].isAC ? props.fridge.cables[cableIndex].inputSignalFrequency >= 0 : true)
                            setInputCurrentValid(props.fridge.cables[cableIndex].isAC ? true : props.fridge.cables[cableIndex].inputCurrent >= 0)
                        }}>{cable.name} ({cable.materialName}) X{cable.quantity} ⚙</Button>
                    )}
                <Dropdown>
                    <Dropdown.Toggle style={{width: "100%"}}  id="preset-dropdown">
                        +
                    </Dropdown.Toggle>

                    <Dropdown.Menu style={{maxHeight: "50vh", overflowY: "scroll"}}> 
                        <Dropdown.Item style={{fontWeight: "bold"}} onClick={() => {
                            setMatName("")
                            setMatNameValid(false)
                            setMatDiams([0, 0, 0])
                            setMatDiamsValid([false, false, false])
                            setMatThermCondCoaxco([0, '119'])
                            setMatThermCondCoaxcoValid(true)
                            setMatCAtt300Coaxco([0, 0, 0, 0, 0])
                            setMatCAtt300CoaxcoValid([true, true, true, true, true])
                            setMatCAtt4Coaxco([0, 0, 0, 0, 0])
                            setMatCAtt4CoaxcoValid([true, true, true, true, true])
                            setMatRhoCoaxco(0)
                            setMatRhoCoaxcoValid(true)
                            setCustAtt(false)
                            setCustAttText(null)
                            setCustAttTextValid(true)
                            setCustCond(false)
                            setCustCondText(null)
                            setCustCondTextValid(true)
                            setShowNewModal(true)
                        }}><Button variant="success" style={{width: "100%"}}>New Material</Button></Dropdown.Item>
                        <Dropdown.Divider></Dropdown.Divider>
                        {cableList.map((cable) => {
                            return(
                                <Dropdown.Item key={cable} onClick={() => {
                                    props.setFridge(produce(fridge => {                                     
                                        fridge.cables.push(cableFactory(cable))
                                        setShow(true); 
                                        let index = fridge.cables.length - 1
                                        setCableIndex(index)
                                        setQuantityValid(fridge.cables[index].quantity)
                                        setInputSignalPowerValid(fridge.cables[index].isAC ? fridge.cables[index].inputSignalPower > 0 : true)
                                        setInputSignalFrequencyValid(fridge.cables[index].isAC ? fridge.cables[index].inputSignalFrequency > 0 : true)
                                        setInputCurrentValid(fridge.cables[index].isAC ? true : fridge.cables[index].inputCurrent > 0)
                                    }))
                                }}
                                >
                                    {cable}
                                </Dropdown.Item>
                            )
                        })}
                        <Dropdown.Divider></Dropdown.Divider>
                        {customCables.cables.map((cable, index) => {
                            return (
                                <div style={{display: "flex", flexDirection: "row"}}>
                                    <Dropdown.Item key={cable.materialName} onClick={() => {
                                        props.setFridge(produce(fridge => {                             
                                            fridge.cables.push(customCableFactory(cable.materialName, cable.materialDiams, cable.materialThermCondCoaxco, cable.materialCAtt300Coaxco, cable.materialCAtt4Coaxco, cable.materialRhoCoaxco))
                                            setShow(true); 
                                            let index = fridge.cables.length - 1
                                            setCableIndex(index)
                                            setQuantityValid(fridge.cables[index].quantity)
                                            setInputSignalPowerValid(fridge.cables[index].isAC ? fridge.cables[index].inputSignalPower > 0 : true)
                                            setInputSignalFrequencyValid(fridge.cables[index].isAC ? fridge.cables[index].inputSignalFrequency > 0 : true)
                                            setInputCurrentValid(fridge.cables[index].isAC ? true : fridge.cables[index].inputCurrent > 0)
                                        }))
                                    }}
                                    >
                                        {cable.materialName}
                                    </Dropdown.Item>
                                    <Button variant="danger" onClick={() => {
                                        setCustomCables(produce(cables => {
                                            cables.cables.splice(index, 1)
                                            }
                                        ))                       
                                        }}>
                                        🗑
                                    </Button>
                                </div>
                                
                            )
                        })}
                        {customCables.cables.length === 0 && <Dropdown.Item disabled>No Custom Materials</Dropdown.Item>}
                    </Dropdown.Menu>
                </Dropdown>

                {/* All subsequent rows (for each stage) */}
                {props.fridge.stages.map((stage, index) => <VisualisationRow key={index} latestAttenuation={latestAttenuation} setLatestAttenuation={setLatestAttenuation} rowIndex={index} stageName={stage.name} fridge={props.fridge} setFridge={props.setFridge}/>)}
            </div>
            
            <Button variant="primary" disabled={!props.fridge.cables || props.fridge.cables.length <= 0} onClick={calculateThermalisation}>Confirm Changes</Button>
            
        </div>
    )
}

function VisualisationRow(props) {
    return (
        <>
            <p style={{fontWeight: "bold"}}>{props.stageName}</p>
            {props.fridge.cables.map((cabl1e, index) => 
                <VisualisationItem key={index} latestAttenuation={props.latestAttenuation} setLatestAttenuation={props.setLatestAttenuation} fridge={props.fridge} setFridge={props.setFridge} rowIndex={props.rowIndex} colIndex={index}/>
            )}
            <p></p>
        </>
    )
}

function VisualisationItem(props) {
    function addAttenuator() {
        props.setFridge(produce(fridge => {
            fridge.cables[props.colIndex].attenuators[props.rowIndex] = attenuatorConstructor(props.latestAttenuation)
        }))
    }

    function changeAttenuation(frequency) {
        if(isNaN(frequency) || frequency < 0) frequency = 0
        props.setFridge(produce(fridge => {
            fridge.cables[props.colIndex].attenuators[props.rowIndex].frequency = frequency
        }))
        props.setLatestAttenuation(frequency)
    }

    function removeAttenuator() {
        props.setFridge(produce(fridge => {
            fridge.cables[props.colIndex].attenuators[props.rowIndex] = null
        }))
    }

    return(
        <Card>
            {props.fridge.cables[props.colIndex].attenuators[props.rowIndex] ? 
            <div style={{display: "flex", flexDirection: "row"}}>
                <Form.Control type="number" placeholder="Attenuation (dB)" value={props.fridge.cables[props.colIndex].attenuators[props.rowIndex].frequency.toString()} onChange={e => changeAttenuation(e.target.value*1)}/>
                <Button variant="danger" onClick={removeAttenuator}>🗑</Button> 
            </div>
            : 
            <Button variant="primary" style={{opacity: 0.6}} onClick={addAttenuator}>+ Attenuator</Button>}
        </Card>
    )
}

export default WiringConfiguration
