import React from 'react';
import ReactDOM from 'react-dom';
import CascadedSelect from '../dist';
import Options from './api';
ReactDOM.render(
    <CascadedSelect
    placeholder="All"
    options={Options}
    onChange={(val)=>{console.log(val)}}
    style={{width:'300px'}}
     />,
    document.getElementById('content')
);