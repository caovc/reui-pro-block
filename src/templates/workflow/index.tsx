import Flowly from './flowly';
import Mesh from './mesh';
import Echo from './echo';
import Lucent from './lucent';
import Tempo from './tempo';
import Flux from './flux';
import './workflow.css';
export default function WorkflowTemplate({id}:{id:string}) { switch(id){case 'flowly':return <Flowly/>;case 'mesh':return <Mesh/>;case 'echo':return <Echo/>;case 'lucent':return <Lucent/>;case 'tempo':return <Tempo/>;case 'flux':return <Flux/>;default:return null;} }
