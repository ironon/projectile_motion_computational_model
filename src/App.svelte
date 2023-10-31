<script lang="ts">
  import World from "./lib/World.svelte";
  import {World as GameWorld, Ball, GameObject} from "./lib/Existance"
  import type {WorldInfo} from "./lib/Existance"
import { onMount } from "svelte";
  
  let world_settings = {
      elasticity: 1,
      gravity: -9.81,
      width: 800,
      height: 600,
      scale: 5, // this means that every 5 pixels is 1 meter
      // display_scale: 2,
      zoom_x: 400,
      zoom_y: 300,
      zoom_percentage: 1,
      alignment: "middle",
      time_scale: 1,
      max_steps: 10,
      show_path: false


  }
  let shouldReset = false
  function resetData() {
      shouldReset = true
      location.reload()
  }
  window.onbeforeunload = function(){
      if (!shouldReset) {
          this.localStorage['settings'] = JSON.stringify(world_settings)
      } else {
          this.localStorage['settings'] = null
      }
  };
  onMount(() => {
      let maybe_settings = JSON.parse(window.localStorage['settings'])
      if (maybe_settings) {
          world_settings = maybe_settings
      }
      zoomX = world_settings.zoom_x
      zoomY = world_settings.zoom_y
      showPaths = world_settings.show_path
      zoomPercentage = world_settings.zoom_percentage
 
      window.addEventListener("keydown", (event) => {
          if (event.key === "p") {
              if (GameWorld.paused) {
                  unpauseSim()
              } else {
                  pauseSim()
              }
          }
          // do something
      });
      
  })
  let world_settings_visible = {
      'elasticity': true,
      'gravity': false,   
      'width': false,
      'height': false,
      'scale': true,
      'display_scale': true,
      'time_scale':true,
      'max_steps': true


  }
  //@ts-ignore
  let visible_world_settings = Object.keys(world_settings).filter((val) => world_settings_visible[val]) //goofy ah typescript!?
  let derivative: number[] = []
  let ball_launch_settings: number[] = [-1, 9.8]
  let ball_launch_angle: number[] = [-1, -90]
  let angle = Math.PI/4
  let xpos = 0
  let ypos = 600
  let inverted_ypos = 0
  let balls_from = 0
  let showPaths = world_settings.show_path
  let balls_to = 90
  let balls_amount = 150
  let table: number[][] = []
  // let alignment = "middle"
  let zoomX = world_settings.zoom_x
  let zoomY = world_settings.zoom_y
  let selectedObject: GameObject|null = null
  let zoomPercentage = world_settings.zoom_percentage
  let clearAllObjects = () => {
      GameWorld.clearAll()
      
  }
  // derivative has all numbers 0 through 100
  for (let i=0;i<101;i++) {
      derivative[i] = i
      if (ball_launch_settings[i] == null || ball_launch_settings[i] == -1) {
          ball_launch_settings[i] = 0
      }
      if (ball_launch_angle[i] == null || ball_launch_angle[i] == -1) {
          ball_launch_angle[i] = 0
      }
     
  }
 
  function launchBall() {
      
      let [ball_launch_settings_x, ball_launch_settings_y] = GameWorld.getComponentsOfKinematics(ball_launch_settings, ball_launch_angle)
      ball_launch_settings_x.unshift(xpos)
      ball_launch_settings_y.unshift(ypos)
      
      let ball = new Ball(ball_launch_settings_x, ball_launch_settings_y, "black", world_settings, 10)
      GameWorld.addToWorld(ball)
  }
  function fanwave() {
      let total_angle = (balls_to - balls_from) * (Math.PI/180)
      let [ball_launch_settings_x, ball_launch_settings_y] = GameWorld.getComponentsOfKinematics(ball_launch_settings, ball_launch_angle)
      
      ball_launch_settings_x.shift()  
      ball_launch_settings_y.shift()
      //@ts-ignore
      let velocity = parseFloat(prompt("velocity? "))
      for (let i = 0; i < balls_amount; i++) {
          let obj = Ball.createWithVector(xpos, ypos, velocity, balls_from + (total_angle/(balls_amount))*i, world_settings, ball_launch_settings_x, ball_launch_settings_y)
          GameWorld.addToWorld(obj)
      }
  }

  let kinematics_lang = ["Velocity", "Acceleration", "Jerk", "Snap", "Crackle", "Pop", "Lock", "Drop"]
  function getNameForDerivative(num: number) {
      if (num > kinematics_lang.length-1) {
          return num + "th"
      }
      return kinematics_lang[num]
  }

  let kinematics_lang_position = ["Position", "Velocity", "Acceleration", "Jerk", "Snap", "Crackle", "Pop", "Lock", "Drop"]
  function getNameForDerivativeP(num: number) {
      if (num > kinematics_lang_position.length-1) {
          return num + "th"
      }
      return kinematics_lang_position[num]
  }

  function onDerivativeChange(e:any) {
      //@ts-ignore
      
      let value = 0
      if (e.target.value != '' && !isNaN(e.target.value)) {
        
          value = parseFloat(e.target.value)

          let id = parseInt(e.target.id)
         
          ball_launch_settings[id] = value
      }
  }
  function onCanvasClick(x:number, y:number) {
      [xpos, ypos] = GameWorld.zoomCoordsToRealCoords(x, y) //makes it so u can click the canvas and the point u click becomes the ball's launch point
      
  }
  function updateProperties(obj: GameObject){
      selectedObject = obj
  }
  function updateTable(table_data: number[][]) {
      table = table_data
  }
  function controlsChanged() {
      //@ts-ignore
      zoomX = parseFloat(zoomX)
      //@ts-ignore why is typescript stupid
      zoomY = parseFloat(zoomY)
      //@ts-ignore
      zoomPercentage = parseFloat(zoomPercentage)
      console.log(showPaths)
      
      world_settings = {...world_settings, zoom_percentage: zoomPercentage, zoom_x: zoomX, zoom_y:zoomY, show_path: showPaths}
      console.log(world_settings)
  }
  function setVelocity(distance: number, angle: number) {
      ball_launch_angle[0] = angle
      ball_launch_settings[0] = distance
      ball_launch_angle = [...ball_launch_angle]
      ball_launch_settings = [...ball_launch_settings]

  }
  function roundTo(number:number, decimal_places:number) {
      var factorOfTen = Math.pow(10,decimal_places);
      return Math.round(number * factorOfTen)/factorOfTen;
      
  }

  function onDerivativeAngleChange(e:any) {
    
      let value = 0
      if (e.target.value != '' && !isNaN(e.target.value)) {
          value = parseFloat(e.target.value)
    
          let id = parseInt(e.target.id)
          ball_launch_angle[id] = value
      }
  }
  function onWorldSettingsChanged(e: any) {
      //@ts-ignore
    
      let value = 0
      if (e.target.value != '' && !isNaN(e.target.value)) {
          world_settings = {...world_settings, [e.target.id]: parseFloat(e.target.value)}

      }
      
  }
  function pauseSim() {
      GameWorld.pause()
  }
  function unpauseSim() {
      GameWorld.unpause()
  }
  
  let getWorldSettings = () => {
  
      return world_settings
  }
  function getTime(selectedObject: GameObject) {
      //@ts-ignore
      return selectedObject.world.time
  }
</script>


  <div id="interface">
      <div id="columns">
          <World framerate="60" height="600" width="800" updateTable={updateTable} {updateProperties} getWorldSettings={getWorldSettings} canvasclick={onCanvasClick} setvelo={setVelocity}/>
          <div id="world_settings">
              {#each visible_world_settings as world}
                  <p>{world.toUpperCase()}</p>
                  <input type="number" id={world} bind:value={world_settings[world]} on:change={onWorldSettingsChanged}>
                  <br/>
              {/each}
          </div>
          <div id="toys">
              <div id="fanwave_container">
                  <h3>Toys</h3>
                  <button on:click={fanwave}>Fan Wave</button>
                  <br/>
                  <label>From Angle</label>
                  <input bind:value={balls_from} placeholder="90"/>
                  <label>To Angle</label>
                  <input bind:value={balls_to} placeholder="90"/>
                  <label>Ball Amount</label>
                  <input bind:value={balls_amount} placeholder="150"/>

              </div>
          </div>
          <div id="topright">
              <h1>David's Amazing Spectacular Computational Model</h1>

              <div id="datap">
                      <table>
                          <tr>
                              <th>Time</th>
                              <th>X Position</th>
                              <th>Y Position</th>
                              <th>X Velocity</th>
                              <th>Y Velocity</th>
                              <th>X Acceleration</th>
                              <th>Y Acceleration</th>
                          </tr>
                          {#each table as point, i}
                              <tr>
                                  {#each point as p, i2}
                                  <th>{roundTo(p, 5)}</th>
                                  {/each}
                              </tr>
                          {/each}
                      </table>
              </div>
          </div>
      </div>
      <div id="controls">
          <div id="ball">
              <h3>Launch Ball</h3>
              <button id="launch" on:click={launchBall}>LAUNCH!!!</button>
              <div id="important_settings">
                
              
                      <label for="posX">X Position:</label>
                      <input type="number" placeholder="0" name="posX" id="posX" bind:value={xpos}>
                      <label for="posY">Y Position:</label>
                      <input type="number" placeholder="600" name="posY" id="posY" bind:value={inverted_ypos} on:change={() => {ypos = 600 - inverted_ypos}}>
               
              </div>
              {#each derivative as d} 
                  <div id="single">
                      <label for="something" id="dumblabel">{getNameForDerivative(d)}:</label>
                      <input type="number" placeholder="0" name={getNameForDerivative(d)} id={d+""} bind:value={ball_launch_settings[d]} on:change={onDerivativeChange}>
                      <label for="something" id="dumblabel">Angle:</label>
                      <input type="angle" placeholder="45" name={getNameForDerivative(d)} id={d+""} bind:value={ball_launch_angle[d]} on:change={onDerivativeAngleChange}>
                  </div>
              {/each}
              
          
          </div>
          <div id="rightie">
              <div id="actualcontrols">
                  <div id="zoombox">

                      <h3>Controls</h3>
                      <p>Canvas is 800 by 600 pixels</p>
                      <label>Zoom X</label>
                      <input bind:value={zoomX} on:change={controlsChanged} />
                      <label>Zoom Y</label>
                      <input bind:value={zoomY} on:change={controlsChanged}/>
                      <label>Zoom Amount</label>
                      <input bind:value={zoomPercentage} on:change={controlsChanged}/>
                      <button on:click={() => {world_settings.alignment = "left"}}>Left-Aligned Zoom</button>
                      <button on:click={() => {world_settings.alignment = "middle"}}>Middle Zoom</button>
                      <hr/>
                      <label>Show Paths?</label>
                      <input type="checkbox" bind:checked={showPaths} on:change={controlsChanged} />
                      <button on:click={pauseSim}>Pause</button>
                      <button on:click={unpauseSim}>Unpause</button>
                  </div>
                  <div id="ball_controls">
                      <button on:click={clearAllObjects}>Clear all Objects</button>
                      <button on:click={resetData}>Reset All Data</button>
                  </div>
                  <div id="properties">
                      {#if selectedObject != undefined && selectedObject.world != undefined}
                      <!--TS ur crazy, time definitely exists on that type idk what to say-->
                          <p>{roundTo(getTime(selectedObject), 2)} seconds</p>
                   
                          <div id="prop_kine">
                              <div id="x_stuff">
                                  <h3>X</h3>
                                  {#each selectedObject.x_kinematics as stat, index}
                                      <p>{getNameForDerivativeP(index)}: {roundTo(stat, 4)}</p>
                                  {/each}
                              </div>
                              <div id="y_stuff">
                                  <h3>Y</h3>
                                  {#each selectedObject.y_kinematics as stat, index}
                                      <p>{getNameForDerivativeP(index)}: {roundTo(stat, 4)}</p>
                                  {/each}
                              </div>
                          </div>
                      {/if}
                  </div>
              </div>
             
          </div>
      </div>
  </div>


<style scoped>
  
  #interface{
      overflow-x:hidden;
      display: flex;
      flex-direction: column;
      height: 98vh;
      width: 100%;
  }
  #topright {
      min-height: 100%;
      max-height: 100%;
      overflow-y: scroll;
      width: 25%;

      
  }
  #datap {
      overflow-y: scroll;
      max-height:50vh;
  }
  
  #datap table{
      height: 100%;
      overflow-y: scroll;
  }
 #properties {
  border-left: 1px solid black;
  padding: 10px;
 }
  #prop_kine {
      display: flex;
      flex-direction: row;
      width: 600px;
      border: 0px solid black;
      
  }
  #x_stuff, #y_stuff {
      display: flex;
      width: 30%;
      flex-direction: column;
      border: 0px solid black;
      border-right: 1px solid black;
     
  }

  #dumblabel {
      width: 10px;
  }
  #toys {
      /* padding: 10px; */
      width: 10%;
  }
  #world_settings {
      border: 1px solid black;
      /* min-width: 10px; */
      /* padding: 2ch; */
      width: 15%;
  }
  #columns {
      display: flex;
      flex-direction: row;
      
      
  }
  #controls {
      display: flex;
      flex-direction: row;
      /* min-height: 10px; */
      max-height: fit-content;
      border: 1px solid black;
  }
  #ball {
      min-width: 800px;
      border: 1px solid black;
      display: flex;
      flex-direction: column;
  }
  #important_settings {
  
      padding: 20px;
      margin-bottom: 20px;
  }
  #zoombox {
      display: flex;
      flex-direction: column;
  }
  #single {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
  }
  #actualcontrols {
      display: flex;
      flex-direction: row;
      padding: 10px;
      width: 40%;
  }
  #toys {
      display: flex;
      border: 1px solid black;
      /* max-width: 150px; */
      /* justify-content: center; */
      flex-direction: column;
  }
  #toys input {
      width: 90%;
      
  }
 
</style>