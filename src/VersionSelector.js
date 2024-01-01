import React, {Component} from 'react';
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card"

export default class VersionSelector extends React.Component {
    render() {
        return (
            <div style={{width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>             
                <Card style={{width: "95%", height: "95%", overflowY: "auto"}}>
                    <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%"}}> 
                        <h2>Cirqus Wiring</h2>
                        <br/>
                        <p>Please select a version to use</p>
                        <div style={styles.middleRowDiv}>
                            <Button style={{flex: 1}} href="/online">Online (Usable across browsers)</Button>
                        </div>
                        <div style={styles.middleRowDiv}>
                            <Button style={{flex: 1}} href="/offline">Offline (Data stored locally in browser)</Button>
                        </div>
                        <a href="https://studentutsedu-my.sharepoint.com/:w:/g/personal/jon_c_mclean_student_uts_edu_au/ES8JVZZnZP9FibaGRylD6bcBR7_3m-JPyyDkPGLmZkNL-g?e=Ft9ZPW">Instructions</a>
                    </div>
                </Card>
            </div>
        )
    }
}

const styles = {
    middleRowDiv: {
        display: "flex",
        flexDirection: "row",
        width: "30%",
        padding: "0.2em"
    },
}