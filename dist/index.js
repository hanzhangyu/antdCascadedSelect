/**
 * Created by Paul on 2016/12/12.
 * 此组件功能有待开发完整
 */
//optionsState:
//[
//    {
//        "label": "EMEA",
//        "value": "EMEA",
//        "selected: number  数值基数1000，表示全选子项的个数，小于1000的数指的是未全选的子项，onChange的时候动态植入，为了避免小数的失准所有select乘上1000
//        "children":[{
//            "label": "EMEA 1",
//            "value": "EMEA 1",
//            "selected: number
//        },{
//            "label": "EMEA 2",
//            "value": "EMEA 2"
//        }]
//    },
//    {
//        "label": "APAC",
//        "value": "APAC",
//        "children":[{
//            "label": "APAC 1",
//            "value": "APAC 1"
//        },{
//            "label": "APAC 2",
//            "value": "APAC 2"
//        }]
//    }
//]
import React, { PropTypes } from 'react';
import classnames from 'classnames';
import { merge,map,cloneDeep } from 'lodash';
import './style.less';
var computeFn = (target, isAdd, num)=> {
    target = target || 0;
    return isAdd ? (target + num) : (target - num);
};
var isArray = (obj)=> {
    return Object.prototype.toString.call(obj)=='[object Array]';
};
const step = 1000;
var CascadedSelect = React.createClass({
    getInitialState(){
        return {
            stateChanging: false,// 是否有value的state改变，启用动画时用
            optionsState: this.props.options || null, //所有的options，这里不需要key因为在渲染show的时候已经产生了动态的坐标
            valuesState: [], // {label: 'All', value: 'All', state: ''} state 0:remove/1:add,待定this.props.value以后再加
            valueKey: [],
            //valuesState: [['All']], // 待定this.props.value以后再加
            //valueKey: [[0]],
            showOptions: false, // list开关
            showSearch: false,// 搜索下拉框开关
            searchState: [],// 数据结构{label: 'All',value: 'All',key:[1,2,3]}，突然发现key和state可以整合，可惜不想改values了
            hidePlaceHolder: false,
            //selectedState: [[1, 2], [1, 3]], // 已废弃（嵌入options树中减少遍历）：如：[[1, 2], [1, 3]]第二个option下的第三个option 和 第二个option下的第四个option
            show: [null], // 如：[1,1,1,*]第二个option下的第二个option下的第二个option，注意这里只有第一个的index包括All选项（0等于All，其他均不含All），最后一个为值NULL，为了循环最后没有子项的option
        }
    },
    getDefaultProps() {
        return {
            options: null,
            style: {},
            placeholder: '',
            value: [[1, 2, 1]],
            //value: [],//  已废弃（初始传过来的值没想到好的格式嵌入options树）：初始已选择的部分,[[1, 2], [2, 'All']]第二个option下的第三个option 和 第三个option下的所有option
            onFocus(){
            },
            onBlur(){
            },
            onChange(val){
            },
            filter(value, item){
                return item.label.toLowerCase().indexOf(value.toLowerCase()) != -1
            }
        }
    },

    // ### 方法
    nodeSelectAllMap(Parent){// 下游全选
        return Parent.map((item)=> {
            if (item.children) {
                item.selected = item.children.length * step;
                this.nodeSelectAllMap(item.children)
            } else item.selected = step;
        })
    },
    nodeCancelAllMap(Parent){// 下游全不选
        return Parent.map((item)=> {
            if (item.children) {
                item.selected = 0;
                this.nodeCancelAllMap(item.children)
            } else item.selected = 0;
        })
    },
    findOptionNode(route, option = this.state.optionsState) {// 根据route寻找option引用
        var optionChildren = option;
        for (let j = 0; j < route.length; j++) {
            option = optionChildren[route[j]];
            optionChildren = option.children;
        }
        return option
    },
    getAllChildrenValue(parent, valueArray = []){// 返回所有子option的集合（deep）
        parent.children.map((item)=> {
            if (!item.children)valueArray.push(item.value);
            else this.getAllChildrenValue(item, valueArray);
        });
        return valueArray
    },
    search(value = this.refs.input.value, Parent = this.state.optionsState, key = [], prevLabel = '', result = []){// 搜索函数
        Parent.map((item, index)=> {
            if (this.props.filter(value, item)) {
                result.push({
                    label: prevLabel + item.label,
                    value: item.value,
                    key: key.concat(index),
                    selectedType: item.selected > 0 ? ((item.children ? (item.selected == item.children.length * step) : (item.selected == step)) ? 1 : 2) : 0
                })
            }
            if (item.children) {
                this.search(value, item.children, key.concat(index), prevLabel + item.label + ' / ', result)
            }
        });
        return result;
    },
    values(){//调用getAllChildrenValue为change事件返回所有子option集合
        let result = [];
        this.state.valueKey.map((item)=> {
            var option = this.findOptionNode(item);
            option = option.children ? (this.getAllChildrenValue(option)) : (option.value);
            isArray(option) ? map(option, (item)=> {
                result.push(item)
            }) : result.push(option)
        });
        return result;
    },
    resetOption(newOptions){//  state状态回归
        // 更新options
        newOptions = cloneDeep(newOptions);
        newOptions[0] && newOptions[0].value != 'All' && newOptions.unshift({
            label: "All",
            value: "All",
            selected: 0
        });
        this.setState({
            optionsState: newOptions,
            valuesState: [],
            valueKey: [],
            showOptions: false,
            showSearch: false,
            searchState: [],
            show: [null]
        })
    },

    // ### 对外接口
    reset(value = [], newOptions = this.state.optionsState){//value 需要手动配置，因为输入value与输出value不一样一个是route的集合一个是label的集合
        // 更新value，传给一个新的克隆值，给予改变
        var valueStateTemp = [];
        value = cloneDeep(value);
        newOptions = cloneDeep(newOptions);
        value.map((item, index)=> {
            let result = this.findOptionNode(item, newOptions)
            valueStateTemp.push({label: result.label, value: result.value, state: 1})
            this.selectChange(item, true, index, newOptions);
        })
        this.setState({
            optionsState: newOptions,
            valuesState: valueStateTemp,
            valueKey: value,
            show: [null]
        })
    },

    // ### 事件函数
    selectChange(coordinate, isOptions, key, optionsState = this.state.optionsState){
        var {show,valueKey,valuesState,showSearch,searchState} = this.state;
        // state改变需要加入动画
        if (this.state.stateChanging)return;
        this.setState({stateChanging: true});
        // key表示点的不是OPTION框里面的情况下的index（index在下方已使用，所以用这个，表示他不是坐标是路径，一开始设计失误）
        key !== undefined && (show = resultCoordinate = coordinate);
        var i,
            optionRefer = optionsState,
            optionChildren = optionsState,
            routeArray = [],
            resultCoordinate;// 保存根据坐标参数的每个引用生成点击路径
        var setShowSearch = ()=> showSearch && (searchState=this.search());
        // 拿到正确的option以及向上整个引用数组
        for (i = 0; i < show.length; i++) {
            // 判断是否到show底部（i== coordinate[0]为到show底部的一种特殊情况：点击的目标不在show的路径下）
            if ((show[i] !== null && i != coordinate[0]) || key !== undefined) {
                optionRefer = optionChildren[show[i]];
                optionChildren = optionRefer.children;
                routeArray[i] = optionRefer;
            } else {
                optionRefer = optionChildren[coordinate[1]];
                optionChildren = optionRefer.children;
                routeArray[i] = optionRefer;
                show = show.slice(0, i);
                resultCoordinate = cloneDeep(show);
                resultCoordinate.push(coordinate[1]);
                isOptions ? (show.push(coordinate[1], null)) : (show.push(null));
                break;
            }
        }
        // 点击All
        key !== undefined && (isOptions = optionChildren && optionChildren.length > 0);
        if (key !== undefined ? (show.join('/') == 0) : (coordinate[0] == 0 && coordinate[1] == 0)) {
            if (optionsState[0].selected) {
                this.nodeCancelAllMap(optionsState);
                optionsState[0].selected = 0;
                valuesState=[];
                valueKey=[];
            } else {
                this.nodeSelectAllMap(optionsState);
                optionsState[0].selected = step;
                valuesState=[{label: 'All', value: 'All'}];
                valueKey=[[0]];
            }
            setShowSearch();
            this.setState({searchState:searchState,show:show,valuesState:valuesState,valueKey:valueKey})
            return [0, 0];
        }
        let shouldSmall = false,
            deleteNum = 0,
            shouldBreak;
        // 更改option树
        if (isOptions ? (optionRefer.selected != optionChildren.length * step) : (optionRefer.selected === 0 || optionRefer.selected === undefined)) {
            //console.log("%cstart", 'color:red;font-size:14px;');
            // 逻辑：父级通过检查自己selected是否被1000整除判断子项是否全选，子项全选加1000（根据实际值计算出加上何值才能凑成1000），不全选加1。
            // 注意千单位为全选子项，个数单位为不全选的子项
            for (i = routeArray.length - 1; i >= 0; i--) {
                let routeTemp = routeArray[i];//当前项
                //是否在点击router末端
                if (i != routeArray.length - 1) {
                    //console.log(shouldSmall) //是否需要加小数
                    if (shouldSmall) {
                        if (routeTemp.selected && shouldBreak)break;
                        shouldBreak = routeTemp.selected;
                        routeTemp.selected = computeFn(routeTemp.selected, true, 1);
                    } else {
                        shouldBreak = routeTemp.selected;
                        routeTemp.selected = computeFn(routeTemp.selected, true, step - deleteNum);
                    }
                    // （当前项没有全选）？（父级应该加小于step的数）：（父级应该加step了，记录当前是否选择了子项传入父级）
                    (routeTemp.selected != routeTemp.children.length * step) ? (shouldSmall = true) : (deleteNum = 1);
                }
                else {
                    if (isOptions) {
                        routeTemp.selected == undefined && (routeTemp.selected = 0);
                        (routeTemp.selected != 0) && (deleteNum = 1);
                        routeTemp.selected = routeTemp.children.length * step;
                    } else {
                        routeTemp.selected = computeFn(routeTemp.selected, true, step)
                    }
                }
                //console.log('%cresult:' + routeArray[i].selected, 'color:orange')
            }
            isOptions && this.nodeSelectAllMap(optionChildren);
        }
        else {
            //console.info("start");
            for (i = routeArray.length - 1; i >= 0; i--) {
                let routeTemp = routeArray[i];//当前项
                //是否在点击router末端
                if (i != routeArray.length - 1) {
                    if (shouldSmall) {
                        if (shouldBreak)break;
                        shouldBreak = routeTemp.selected > 1;
                        routeTemp.selected = computeFn(routeTemp.selected, false, 1);
                    } else {
                        routeTemp.selected = computeFn(routeTemp.selected, false, step - deleteNum);
                        shouldBreak = routeTemp.selected > 0
                    }
                    // （当前项点击前没有全选）？（父级应该加小于step的数）：（父级应该加step了，记录当前是否选择了子项传入父级）
                    (parseInt(routeTemp.selected / step) != (routeTemp.children.length - 1)) ? (shouldSmall = true) : (deleteNum = 1);
                }
                else {
                    isOptions ? (routeTemp.selected = 0) : (routeTemp.selected = computeFn(routeTemp.selected, false, step));
                }
                //console.info('result:' + routeArray[i].selected)
            }
            isOptions && this.nodeCancelAllMap(optionChildren);
        }

        // 检查是否node树全选
        let isAll = 0;
        optionsState.map((item, i)=> {
            (i != 0 && item.children) && (isAll += item.selected == item.children.length * step);
        });
        (isAll == optionsState.length - 1) ? (optionsState[0].selected = step) : (optionsState[0].selected = 0);
        // 生成values
        if (isOptions ? (optionRefer.selected == optionRefer.children.length * step) : (optionRefer.selected == step)) {
            //全选
            if (isAll == optionsState.length - 1) {
                let valueTemp = [], keyTemp = [];
                optionsState.map((item, index)=> {
                    index == 0 ? valueTemp.push({
                        label: item.label,
                        value: item.value,
                        state: 1
                    }) : valueTemp.push({label: item.label, value: item.value, state: 0});
                    keyTemp.push([index]);
                });
                this.setState({valuesState: valueTemp, valueKey: keyTemp,searchState:searchState,show:show});
                setShowSearch();
                return resultCoordinate;
            }
            let index,
                valuesStateTemp = cloneDeep(valuesState),
                valueKeyTemp = cloneDeep(valueKey),
                prevLabel = '';//应加的前置label
            //看前置
            for (index = 0; index < routeArray.length; index++) {
                if (routeArray[index].children && routeArray[index].selected == routeArray[index].children.length * step)break;
                if (index == routeArray.length - 1)break;
                prevLabel += routeArray[index].label + ' / ';
            }
            //看后面，当前坐标更改为最大项坐标，如果前置没有找到，下列不会执行
            for (i = 0; i < valueKey.length; i++) {
                if (valueKey[i].join('/').indexOf(resultCoordinate.slice(0, index + 1).join('/')) == 0) {
                    //删除该项
                    valuesStateTemp[i].state = 0;
                }
            }
            //添加全选最大项
            valueKeyTemp.push(resultCoordinate.slice(0, index + 1));
            valuesStateTemp.push({
                label: prevLabel + routeArray[index].label,
                value: routeArray[index].value,
                state: 1
            });
            this.setState({valuesState: valuesStateTemp, valueKey: valueKeyTemp,searchState:searchState,show:show});

        }
        else {
            // 取消全选状态
            let isALLTemp;
            if (valueKey.join('') == 0) {
                let valueTemp = [], keyTemp = [];
                isALLTemp = true;
                optionsState.map((item, index)=> {
                    if (index != 0) {
                        valueTemp.push({label: item.label, value: item.value});
                        keyTemp.push([index]);
                    }
                });
                valuesState = valueTemp;
                valueKey = keyTemp;
            }
            //看前置
            for (i = 0; i < valueKey.length; i++) {
                // 点击的位置在之前的options已存在(最多存在一个)，只能是取消，删除
                if (resultCoordinate.join('/').indexOf(valueKey[i].join('/')) == 0) {
                    if (resultCoordinate.join('/') == valueKey[i].join('/')) {
                        // 为了有动画不能直接删，先打标记
                        valuesState[i].state = 0;
                        // 这是要删的
                        if (isALLTemp) {
                            valueKey.splice(i, 1);
                            valueKey.unshift([0]);
                            valuesState.splice(i, 1);
                            valuesState.unshift({label: 'All', value: 'All', state: 0});
                        }
                        // valuesState、valueKey可能指向的并不是state，重定向
                        this.setState((state)=> {
                            state.valuesState = valuesState;
                            state.valueKey = valueKey;
                        });
                        setShowSearch();
                        return resultCoordinate;
                    }
                    let temp = this.findOptionNode(valueKey[i]).children;
                    //添加前置中因为取消全选而分裂的项
                    let resultTemp = findChildrenValues(temp, valueKey[i], valuesState[i].label + ' / ');
                    valuesState[i].state = 0;
                    valueKey.push(...resultTemp.keysArray);
                    valuesState.push(...resultTemp.valuesArray);
                    // valuesState、valueKey可能指向的并不是state，重定向
                    this.setState({valuesState: valuesState, valueKey: valueKey,searchState:searchState,show:show});
                    setShowSearch();
                    return resultCoordinate;
                }
            }
        }

        setShowSearch();

        function findChildrenValues(item, key, prevLabel = '', valuesArray = [], keysArray = []) {
            // 新建数组填写要改变的值，不能在数组循环中改变该数组
            item.map((item, index)=> {
                if ((item.children && item.selected == item.children.length * step) || (!item.children && item.selected == step)) {
                    valuesArray.push({label: prevLabel + item.label, value: item.value, state: 1});
                    keysArray.push(key.concat(index));
                }
                else {
                    //因为点击的只可能是一个按钮（都不用考虑prevLabel清零操作），所以这些循环都是纸老虎，快快哒
                    item.children && findChildrenValues(item.children, key.concat(index), prevLabel + item.label + ' / ', valuesArray, keysArray)
                }
            });
            return {
                valuesArray: valuesArray,
                keysArray: keysArray
            };
        }

        return resultCoordinate
    },
    changeInput(input, text){
        text.innerHTML = input.value;
        var width = window.getComputedStyle(text).width;
        input.style.width = parseInt(width) > 0 ? width : null;
        if (input.value.length > 0) {
            this.setState({
                hidePlaceHolder: true,
                showOptions: false,
                showSearch: true,
                searchState: this.search()
            });
        } else {
            this.setState({hidePlaceHolder: false, showOptions: true, showSearch: false, searchState: []});
        }
    },
    deleteInput(e, input){
        let valueKey = this.state.valueKey,
            index = valueKey.length - 1;
        if (input.value.length === 0 && e.keyCode === 8 && valueKey.length != 0) {
            this.selectChange(valueKey[index], true, index)
        }
    },
    openOptions(e){
        e.stopPropagation();
        this.setState((state) => {
            state.showOptions = true;
            return state;
        });
        this.refs.input.focus();
        window.addEventListener('click', this.closeOptions)
    },
    closeOptions(){
        this.refs.list.classList.add('leave');
        setTimeout(()=> {
            this.setState((state) => {
                state.showOptions = false;
                return state;
            });
            this.refs.list.classList.remove('leave');
        }, 200);
        this.props.onBlur();
        window.removeEventListener('click', this.closeOptions)
    },
    clickSelectBtn(e, coordinate){// 点击了有子项的option上面的选择图标
        e.stopPropagation();
        this.selectChange(coordinate, true);
    },
    clickOptions(coordinate, hasChild){
        //coordinate [列，行]
        if (hasChild) {
            this.setState((state)=> {
                state.show[coordinate[0]] = coordinate[1];
                state.show.length = coordinate[0] + 1;
                state.show.push(null);
            })
        } else {
            // 根据点击的router修改node树,并返回改变的值的坐标
            this.selectChange(coordinate, false);
        }
    },
    componentDidUpdate(){
        if (this.state.stateChanging) {
            // 使用定时器让react先生成DOM在植入动画
            setTimeout(()=> {
                map(document.getElementsByClassName('zoom-enter'), (item)=> {
                    item.classList.add('zoom-enter-active')
                });
                map(document.getElementsByClassName('zoom-leave'), (item)=> {
                    item.classList.add('zoom-leave-active')
                })
                // 动画完成后状态回归
                setTimeout(()=> {
                    this.setState((state)=> {
                        let valuesTemp = cloneDeep(state.valuesState), deleteNum = 0;
                        valuesTemp.map((item, index)=> {
                            if (item.state === 0) {
                                state.valueKey.splice(index - deleteNum, 1);
                                state.valuesState.splice(index - deleteNum++, 1)
                            } else if (item.state === 1) {
                                state.valuesState[index - deleteNum].state = ''
                            }
                        });
                        state.stateChanging = false;
                    });
                    this.props.onChange(this.values());
                }, 200)
            }, 0);
        }
    },
    componentWillReceiveProps(nextProps){
        this.props.options != nextProps.options && this.resetOption(nextProps.options)
    },
    shouldComponentUpdate(nextProps, nextState){
        // 可删? this.props.options != nextProps.options
        return this.state != nextState || this.props.options != nextProps.options || this.props.placeholder != nextProps.placeholder || this.props.onFocus.toString() != nextProps.onFocus.toString() || this.props.onChange.toString() != nextProps.onChange.toString()
    },
    render(){
        var {options,style,values,placeholder}=this.props;
        var {showOptions,valuesState,valueKey,optionsState,show,hidePlaceHolder,showSearch,searchState}=this.state;
        var optionsTemp = optionsState || null,
            _this = this;
        // options下拉框
        var list = optionsTemp && show && (
                show.map((itemShow, indexShow)=> {
                    var itemShowTemp = show[indexShow - 1];//记录上一个list框的选中要显示的item的值（根据上个list框选的值显示当前list框）
                    (itemShowTemp != undefined && optionsTemp[itemShowTemp]) && optionsTemp[itemShowTemp].children && (optionsTemp = optionsTemp[itemShowTemp].children);
                    return (
                        <ul className="ant-cascader-menu" key={`list${indexShow}`}>
                            {optionsTemp.map((item, index)=> {
                                // 提出item.children减少判断次数
                                if (item.children) {
                                    var type = item.selected > 0 ? (item.selected == item.children.length * step ? 1 : 2) : 0;//0未选1全选2部分选择
                                    return <li
                                        className={classnames("ant-cascader-menu-item",{['selected_all']:type==1,['selected_some']:type==2,['active']:itemShow==index})}
                                        key={item.value}
                                        title={item.value}
                                        onClick={_this.clickOptions.bind(_this,[indexShow,index],true)}>{item.label}<i
                                        onClick={(e)=>{_this.clickSelectBtn(e,[indexShow,index])}}
                                        className="item-expand" title="全选\取消全选"></i></li>
                                } else {
                                    return <li
                                        className={classnames("ant-cascader-menu-item",{['selected']:item.selected==step})}
                                        key={item.value}
                                        onClick={_this.clickOptions.bind(_this,[indexShow,index],false)}
                                        title={item.value}>{item.label}</li>
                                }
                            })}
                        </ul>
                    )
                })
            );

        return (
            <div style={style} onClick={this.openOptions}
                 className={classnames("ant-select ant-select-enabled cascaded_select",{active:showOptions&&!showSearch})}
                 ref="cascadedSelect">
                <div className="ant-select-selection
            ant-select-selection--multiple" role="combobox">
                    <div className="ant-select-selection__rendered">
                        <div
                            className={classnames("ant-select-selection__placeholder",{['hide']:(valueKey.length!=0||hidePlaceHolder)})}>{placeholder}</div>
                        <ul>
                            {/* 显示值 */}
                            {
                                valuesState.map((item, index)=>
                                    <li className={classnames("ant-select-selection__choice",{["zoom-leave"]:item.state===0,["zoom-enter"]:item.state===1})}
                                        title={item.label} key={item.value}>
                                        <div className="ant-select-selection__choice__content">{item.label}</div>
                                        <span className="ant-select-selection__choice__remove"
                                              onClick={()=>this.selectChange(valueKey[index],true,index)}></span>
                                    </li>
                                )
                            }
                            {/* 输入框 */}
                            <li className="ant-select-search ant-select-search--inline">
                                <div className="ant-select-search__field__wrap">
                                    <input className="ant-select-search__field" type="text" ref="input"
                                           onInput={this.changeInput.bind(this,this.refs.input,this.refs.text)}
                                           onKeyUp={(e)=>{this.deleteInput(e,this.refs.input)}}
                                           onFocus={(e)=>{this.props.onFocus(e,this.refs.cascadedSelect)}}/>
                                    <span className="ant-select-search__field__mirror" ref="text"></span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                {/* options下拉框 */}
                <div className="ant-cascader-menus ant-cascader-menus-placement-bottomLeft " ref="list"
                     unselectable="unselectable">
                    {list}
                </div>
                {/* 搜索下拉框 */}
                <div style={{width:style.width}}
                     className={classnames("ant-select-dropdown ant-select-dropdown--multiple ant-select-dropdown-placement-bottomLeft",{show:showSearch})}
                     unselectable="unselectable">
                    <ul className="ant-select-dropdown-menu ant-select-dropdown-menu-vertical  ant-select-dropdown-menu-root">
                        {
                            searchState.length > 0 ? searchState.map((item, index)=>
                                <li className={classnames("ant-select-dropdown-menu-item",{['ant-select-dropdown-menu-item-selected']:item.selectedType==1,['selected_some']:item.selectedType==2})}
                                    title={item.label} key={item.value}
                                    onClick={()=>this.selectChange(item.key,true,index)}>
                                    {item.label}
                                </li>) :
                                <li className="ant-select-dropdown-menu-item-disabled ant-select-dropdown-menu-item">
                                    Not Found
                                </li>
                        }
                    </ul>
                </div>
            </div>
        )
    }
});


CascadedSelect.propTypes = {
    style: PropTypes.object,
    options: PropTypes.array, // 所有options格式同antd
    placeholder: PropTypes.string, //不传不显示
    value: PropTypes.array,//二维数组，子数组表示每个value的route
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    filter: PropTypes.func
};
export default CascadedSelect